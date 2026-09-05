import {
  createInitialState,
  forwardDir,
  getPiece,
  hashPosition,
  indexToPosition,
  isInBoard,
  isInPalace,
  oppositeSide,
} from './board'
import { getGameResult } from './result'
import { generateLegalMoves, isCheck, makeMove, pass } from './rules'
import type { GameState, Move, PieceSetup } from './types'

export interface RandomValidationReport {
  readonly games: number
  readonly completedGames: number
  readonly moveLimitGames: number
  readonly totalPlies: number
  readonly violations: readonly string[]
}

export function perft(state: GameState, depth: number): number {
  if (depth < 0 || !Number.isInteger(depth)) throw new RangeError('depth must be a non-negative integer')
  if (depth === 0) return 1

  const moves = generateLegalMoves(state)
  let nodes = moves.reduce((total, move) => total + perft(makeMove(state, move), depth - 1), 0)
  if (!isCheck(state, state.turn)) nodes += perft(pass(state), depth - 1)
  return nodes
}

function validateState(state: GameState): string[] {
  const violations: string[] = []
  if (state.board.length !== 90) violations.push('board length is not 90')

  for (const side of ['HAN', 'CHO'] as const) {
    const gungs = state.board.filter((piece) => piece?.side === side && piece.type === 'GUNG')
    if (gungs.length !== 1) violations.push(`${side} Gung count is ${gungs.length}`)
  }

  state.board.forEach((piece, index) => {
    if (!piece) return
    const position = indexToPosition(index)
    if (!isInBoard(position)) violations.push(`${piece.id} is outside the board`)
    if ((piece.type === 'GUNG' || piece.type === 'SA') && !isInPalace(position, piece.side)) {
      violations.push(`${piece.id} left its palace`)
    }
  })
  return violations
}

function validatePoTransition(before: GameState, move: Move): string[] {
  if (!move.from || !move.to || move.piece?.type !== 'PO') return []
  const violations: string[] = []
  if (move.captured?.type === 'PO') violations.push('Po captured another Po')

  const fileDelta = move.to.file - move.from.file
  const rankDelta = move.to.rank - move.from.rank
  const fileStep = Math.sign(fileDelta)
  const rankStep = Math.sign(rankDelta)
  const distance = Math.max(Math.abs(fileDelta), Math.abs(rankDelta))
  let screens = 0
  let screenIsPo = false
  for (let step = 1; step < distance; step += 1) {
    const occupant = getPiece(before.board, {
      file: move.from.file + fileStep * step,
      rank: move.from.rank + rankStep * step,
    })
    if (occupant) {
      screens += 1
      screenIsPo ||= occupant.type === 'PO'
    }
  }
  if (screens !== 1) violations.push(`Po crossed ${screens} screens`)
  if (screenIsPo) violations.push('Po used another Po as a screen')
  return violations
}

function validateTransition(before: GameState, after: GameState, beforeHash: string): string[] {
  const violations = validateState(after)
  const move = after.moveHistory.at(-1)
  if (!move) return [...violations, 'move history did not grow']
  if (hashPosition(before.board, before.turn) !== beforeHash) violations.push('source state was mutated')
  if (after.turn !== oppositeSide(before.turn)) violations.push('turn did not change')
  if (after.moveHistory.length !== before.moveHistory.length + 1) violations.push('move history length mismatch')
  if (move.captured?.type === 'GUNG') violations.push('a Gung was captured')

  if (!move.isPass && move.from && move.to && move.piece) {
    if (getPiece(after.board, move.from)) violations.push('source point was not emptied')
    if (getPiece(after.board, move.to)?.id !== move.piece.id) violations.push('piece did not reach destination')
    if (move.piece.type === 'JOL') {
      const rankDelta = move.to.rank - move.from.rank
      if (rankDelta !== 0 && rankDelta !== forwardDir(move.piece.side)) {
        violations.push('Jol moved backward')
      }
    }
    violations.push(...validatePoTransition(before, move))
  }
  return violations
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const SETUPS: readonly PieceSetup[] = ['MSMS', 'SMSM', 'MSSM', 'SMMS']

export function validateRandomGames(
  games = 1000,
  seed = 20260903,
  maxPlies = 120,
): RandomValidationReport {
  const random = seededRandom(seed)
  const violations: string[] = []
  let completedGames = 0
  let moveLimitGames = 0
  let totalPlies = 0

  for (let game = 0; game < games; game += 1) {
    let state = createInitialState(
      SETUPS[game % SETUPS.length],
      SETUPS[(game * 3 + 1) % SETUPS.length],
    )
    let finished = false

    for (let ply = 0; ply < maxPlies; ply += 1) {
      if (getGameResult(state).status !== 'PLAYING') {
        completedGames += 1
        finished = true
        break
      }

      const legalMoves = generateLegalMoves(state)
      const canTakePass = !isCheck(state, state.turn)
      const beforeHash = hashPosition(state.board, state.turn)
      let nextState: GameState
      if (canTakePass && (legalMoves.length === 0 || random() < 0.15)) {
        nextState = pass(state)
      } else if (legalMoves.length > 0) {
        nextState = makeMove(state, legalMoves[Math.floor(random() * legalMoves.length)])
      } else {
        violations.push(`game ${game + 1}, ply ${ply + 1}: check without result`)
        break
      }

      const transitionViolations = validateTransition(state, nextState, beforeHash)
      transitionViolations.forEach((violation) => {
        violations.push(`game ${game + 1}, ply ${ply + 1}: ${violation}`)
      })
      state = nextState
      totalPlies += 1
      if (transitionViolations.length > 0) break
    }

    if (!finished) moveLimitGames += 1
  }

  return { games, completedGames, moveLimitGames, totalPlies, violations }
}
