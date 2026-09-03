import { createInitialState, fromIndex, getPiece, isInBoard, isInPalace, isPalaceDiagonalStep } from './board'
import { mulberry32, playRandomGame } from './playout'
import { getGameResult } from './result'
import { applyLegalMove, generateLegalMoves, isCheck, pass, replayHistory } from './rules'
import type { GameState, Move, Position } from './types'

export interface RandomGameVerification {
  games: number
  plies: number
  finished: number
  checkmates: number
}

// --- structural helpers ---------------------------------------------------

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true
  }
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
    return false
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false
    }
    return left.every((value, index) => deepEqual(value, right[index]))
  }
  const leftKeys = Object.keys(left as Record<string, unknown>)
  const rightKeys = Object.keys(right as Record<string, unknown>)
  if (leftKeys.length !== rightKeys.length) {
    return false
  }
  return leftKeys.every((key) =>
    deepEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
  )
}

function positionsBetween(from: Position, to: Position): Position[] {
  const fileDistance = to.file - from.file
  const rankDistance = to.rank - from.rank
  const isStraight = fileDistance === 0 || rankDistance === 0
  const isPalaceDiagonal =
    Math.abs(fileDistance) === Math.abs(rankDistance) &&
    Math.abs(fileDistance) > 0 &&
    isPalaceDiagonalStep(from, {
      file: from.file + Math.sign(fileDistance),
      rank: from.rank + Math.sign(rankDistance),
    })
  if (!isStraight && !isPalaceDiagonal) {
    return []
  }

  const fileStep = Math.sign(fileDistance)
  const rankStep = Math.sign(rankDistance)
  const positions: Position[] = []
  let current = { file: from.file + fileStep, rank: from.rank + rankStep }
  while (current.file !== to.file || current.rank !== to.rank) {
    positions.push(current)
    current = { file: current.file + fileStep, rank: current.rank + rankStep }
  }
  return positions
}

// --- invariants ---------------------------------------------------------

function validateCannonMove(state: GameState, move: Move): void {
  if (move.from === null || move.to === null || move.piece?.type !== 'PO') {
    return
  }

  const piecesBetween = positionsBetween(move.from, move.to)
    .map((position) => getPiece(state.board, position))
    .filter((piece) => piece !== null)
  if (piecesBetween.length !== 1 || piecesBetween[0].type === 'PO' || move.captured?.type === 'PO') {
    throw new Error(`Cannon invariant violated: ${JSON.stringify(move)}`)
  }
}

function validateBoardState(state: GameState): void {
  let hanGungCount = 0
  let choGungCount = 0
  for (let index = 0; index < state.board.length; index += 1) {
    const piece = state.board[index]
    if (piece === null) {
      continue
    }

    const position = fromIndex(index)
    if (!isInBoard(position)) {
      throw new Error('A piece is off the board.')
    }
    if ((piece.type === 'GUNG' || piece.type === 'SA') && !isInPalace(position, piece.side)) {
      throw new Error(`A palace piece (${piece.side} ${piece.type}) left its palace.`)
    }
    if (piece.type === 'GUNG') {
      if (piece.side === 'HAN') {
        hanGungCount += 1
      } else {
        choGungCount += 1
      }
    }
  }

  if (hanGungCount !== 1 || choGungCount !== 1) {
    throw new Error('A general was captured or duplicated.')
  }
}

function validateLegalMoves(state: GameState, legalMoves: readonly Move[]): void {
  for (const move of legalMoves) {
    if (move.captured?.type === 'GUNG') {
      throw new Error('A legal move may not capture a general.')
    }
    if (move.from !== null && move.to !== null) {
      if (!isInBoard(move.from) || !isInBoard(move.to)) {
        throw new Error('A legal move touches a point off the board.')
      }
      if (move.piece?.type === 'JOL') {
        const signedRankDelta = (move.to.rank - move.from.rank) * (move.piece.side === 'HAN' ? 1 : -1)
        if (signedRankDelta < 0) {
          throw new Error('A soldier moved backward.')
        }
      }
    }
    validateCannonMove(state, move)
  }

  // A side genuinely in check must have every legal move remove the check.
  if (isCheck(state, state.turn)) {
    for (const move of legalMoves) {
      if (isCheck(applyLegalMove(state, move), state.turn)) {
        throw new Error('A legal move left the mover in check.')
      }
    }
  }
}

// --- perft --------------------------------------------------------------

export function perft(state: GameState, depth: number): number {
  if (!Number.isInteger(depth) || depth < 0) {
    throw new RangeError('Perft depth must be a non-negative integer.')
  }
  if (depth === 0) {
    return 1
  }

  return generateLegalMoves(state).reduce(
    (nodes, move) => nodes + perft(applyLegalMove(state, move), depth - 1),
    0,
  )
}

// --- random-game harness ----------------------------------------------

/**
 * Plays `gameCount` full random games (each up to `maxPlies` plies) and throws
 * if any rule invariant is broken along the way. Also checks that undo — via
 * replaying the recorded history — reconstructs every intermediate state
 * exactly.
 */
export function runRandomGames(gameCount: number, maxPlies = 400, seed = 1): RandomGameVerification {
  if (!Number.isInteger(gameCount) || gameCount < 1 || !Number.isInteger(maxPlies) || maxPlies < 1) {
    throw new RangeError('Game count and maximum plies must be positive integers.')
  }

  const seedSource = mulberry32(seed)
  let totalPlies = 0
  let finished = 0
  let checkmates = 0

  for (let gameIndex = 0; gameIndex < gameCount; gameIndex += 1) {
    const gameSeed = Math.floor(seedSource.next() * 0xffffffff)
    let state = createInitialState()
    const snapshots: GameState[] = [state]
    validateBoardState(state)

    for (let ply = 0; ply < maxPlies; ply += 1) {
      const legalMoves = generateLegalMoves(state)
      validateLegalMoves(state, legalMoves)

      if (legalMoves.length === 0) {
        if (isCheck(state, state.turn)) {
          break
        }
        state = pass(state)
      } else {
        const seededSource = mulberry32(gameSeed + ply)
        const move = legalMoves[Math.floor(seededSource.next() * legalMoves.length)]
        validateCannonMove(state, move)
        state = applyLegalMove(state, move)
      }

      validateBoardState(state)
      snapshots.push(state)
      totalPlies += 1

      const outcome = getGameResult(state)
      if (outcome.status !== 'PLAYING') {
        finished += 1
        if (outcome.status === 'CHECKMATE') {
          checkmates += 1
          if (!isCheck(state, state.turn) || generateLegalMoves(state).length !== 0) {
            throw new Error('getGameResult reported checkmate without a real mate.')
          }
        }
        break
      }
    }

    // Undo / replay consistency: reconstructing from the recorded history must
    // land on exactly the same state. Checks the endpoints plus a few interior
    // plies so the cost stays linear in the game length.
    const checkpoints = new Set<number>([0, snapshots.length - 1])
    for (let sample = 0; sample < 4; sample += 1) {
      checkpoints.add(Math.floor(seedSource.next() * snapshots.length))
    }
    for (const count of checkpoints) {
      const rebuilt = replayHistory(state.config, state.moveHistory.slice(0, count))
      if (!deepEqual(rebuilt, snapshots[count])) {
        throw new Error(`Replay mismatch at move ${count} of game ${gameIndex}.`)
      }
    }
    // On a sample of games, exercise the exact undo path the UI uses:
    // repeated slice(0, -1) replays must walk all the way back to the opening.
    if (gameIndex % 15 === 0) {
      let unwound = state
      while (unwound.moveHistory.length > 0) {
        unwound = replayHistory(unwound.config, unwound.moveHistory.slice(0, -1))
      }
      if (!deepEqual(unwound, snapshots[0])) {
        throw new Error(`Undo did not restore the initial position for game ${gameIndex}.`)
      }
    }
  }

  return { games: gameCount, plies: totalPlies, finished, checkmates }
}

/** Convenience wrapper used by the console script and smoke tests. */
export function verifyPlayout(seed: number, maxPlies = 400): void {
  const playout = playRandomGame(seed, maxPlies)
  validateBoardState(playout.state)
  const rebuilt = replayHistory(playout.state.config, playout.state.moveHistory)
  if (!deepEqual(rebuilt, playout.state)) {
    throw new Error('Playout history does not replay to the same final state.')
  }
}
