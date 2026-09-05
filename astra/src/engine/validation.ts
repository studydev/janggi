import { createInitialState, forwardDir, getPiece, hashPosition, indexToPosition, isInBoard, isInPalace, SETUP_PIECES } from './board'
import { getGameResult } from './result'
import { generateLegalMoves, isCheck, makeMove, pass, undoMove } from './rules'
import type { GameState, LegalMove, PieceSetup } from './types'

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function perft(state: GameState, depth: number): number {
  if (!Number.isInteger(depth) || depth < 0) throw new RangeError('Invalid perft depth')
  if (depth === 0) return 1
  const moves = generateLegalMoves(state)
  const canPass = !isCheck(state, state.turn)
  if (depth === 1) return moves.length + Number(canPass)
  return moves.reduce((sum, move) => sum + perft(makeMove(state, move), depth - 1), 0)
    + (canPass ? perft(pass(state), depth - 1) : 0)
}

export function assertStateValid(state: GameState): void {
  invariant(state.board.length === 90, 'Board length is not 90')
  const ids = new Set<string>()
  for (const side of ['HAN', 'CHO'] as const) {
    invariant(state.board.filter((piece) => piece?.side === side && piece.type === 'GUNG').length === 1, `${side}: invalid king count`)
  }
  state.board.forEach((piece, index) => {
    if (!piece) return
    invariant(!ids.has(piece.id), 'Duplicate piece id')
    ids.add(piece.id)
    const position = indexToPosition(index)
    invariant(isInBoard(position), 'Piece outside board')
    if (piece.type === 'GUNG' || piece.type === 'SA') invariant(isInPalace(position, piece.side), 'Palace piece left its palace')
  })
}

function assertMoveValid(state: GameState, move: LegalMove): void {
  invariant(isInBoard(move.from) && isInBoard(move.to), 'Move outside board')
  invariant(move.captured?.type !== 'GUNG', 'Generated a king capture')
  if (move.piece.type === 'JOL') {
    const rankDelta = move.to.rank - move.from.rank
    invariant(rankDelta === 0 || rankDelta === forwardDir(move.piece.side), 'Soldier moved backward')
  }
  if (move.piece.type !== 'PO') return
  invariant(move.captured?.type !== 'PO', 'Cannon captured a cannon')
  const fileStep = Math.sign(move.to.file - move.from.file)
  const rankStep = Math.sign(move.to.rank - move.from.rank)
  const distance = Math.max(Math.abs(move.to.file - move.from.file), Math.abs(move.to.rank - move.from.rank))
  let screens = 0
  for (let step = 1; step < distance; step += 1) {
    const occupant = getPiece(state.board, { file: move.from.file + fileStep * step, rank: move.from.rank + rankStep * step })
    if (occupant) {
      screens += 1
      invariant(occupant.type !== 'PO', 'Cannon jumped a cannon')
    }
  }
  invariant(screens === 1, 'Cannon did not jump exactly one screen')
}

function assertRestored(before: GameState, after: GameState): void {
  const restored = undoMove(after)
  invariant(restored.turn === before.turn && restored.config === before.config, 'Undo changed turn or config')
  for (const key of ['board', 'moveHistory', 'capturedPieces', 'positionHistory'] as const) {
    invariant(restored[key].length === before[key].length, `Undo changed ${key} length`)
    invariant(restored[key].every((entry, index) => entry === before[key][index]), `Undo changed ${key}`)
  }
}

export interface RandomValidationReport {
  games: number
  completedGames: number
  totalPlies: number
  endings: Record<string, number>
  violations: string[]
}

export function validateRandomGames(games = 1000, seed = 20260905): RandomValidationReport {
  if (!Number.isInteger(games) || games < 1) throw new RangeError('Invalid game count')
  let randomState = seed >>> 0
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    return randomState / 0x100000000
  }
  const report: RandomValidationReport = { games, completedGames: 0, totalPlies: 0, endings: {}, violations: [] }
  const setups = Object.keys(SETUP_PIECES) as PieceSetup[]
  for (let game = 0; game < games; game += 1) {
    let state = createInitialState(setups[game % 4], setups[Math.floor(game / 4) % 4], {
      bikjangEnabled: game % 2 === 0, repetitionCount: 2 + game % 3,
    })
    try {
      assertStateValid(state)
      for (let ply = 0; ply < 768 && getGameResult(state).status === 'PLAYING'; ply += 1) {
        const beforeHash = hashPosition(state.board, state.turn)
        const moves = generateLegalMoves(state)
        for (const move of moves) assertMoveValid(state, move)
        const canPass = !isCheck(state, state.turn)
        const choosePass = canPass && (moves.length === 0 || random() < (ply >= 128 ? 0.8 : 0.12))
        invariant(choosePass || moves.length > 0, 'Checkmate was not adjudicated')
        const next = choosePass ? pass(state) : makeMove(state, moves[Math.floor(random() * moves.length)])
        assertStateValid(next)
        invariant(!isCheck(next, state.turn), 'Move left own king in check')
        invariant(hashPosition(state.board, state.turn) === beforeHash, 'Input board mutated')
        assertRestored(state, next)
        state = next
        report.totalPlies += 1
      }
      const result = getGameResult(state)
      invariant(result.status !== 'PLAYING', 'Game did not reach a terminal result')
      report.completedGames += 1
      report.endings[result.reason] = (report.endings[result.reason] ?? 0) + 1
    } catch (error) {
      report.violations.push(`Game ${game + 1}, ply ${state.moveHistory.length}: ${String(error)}`)
      return report
    }
  }
  return report
}