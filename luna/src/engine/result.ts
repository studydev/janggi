import { findGungPosition, generateLegalMoves, isCheck, positionKey } from './rules'
import { getPiece, otherSide } from './board'
import type { GameResult, GameState, PieceType, Side } from './types'

const PIECE_VALUES: Record<PieceType, number> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
}

export function isCheckmate(state: GameState, side: Side): boolean {
  const sideState = state.turn === side ? state : { ...state, turn: side }
  return isCheck(sideState, side) && generateLegalMoves(sideState).length === 0
}

export function isBikjang(state: GameState): boolean {
  const hanGung = findGungPosition(state.board, 'HAN')
  const choGung = findGungPosition(state.board, 'CHO')
  if (hanGung === null || choGung === null || hanGung.file !== choGung.file) return false
  const startRank = Math.min(hanGung.rank, choGung.rank) + 1
  const endRank = Math.max(hanGung.rank, choGung.rank)
  for (let rank = startRank; rank < endRank; rank += 1) {
    if (getPiece(state.board, { file: hanGung.file, rank }) !== null) return false
  }
  return true
}

export function calculateScore(state: GameState, side: Side): number {
  let score = side === 'HAN' ? 1.5 : 0
  for (const piece of state.board) {
    if (piece?.side === side) score += PIECE_VALUES[piece.type]
  }
  return score
}

function scoreWinner(state: GameState): Side | null {
  const hanScore = calculateScore(state, 'HAN')
  const choScore = calculateScore(state, 'CHO')
  if (hanScore === choScore) return null
  return hanScore > choScore ? 'HAN' : 'CHO'
}

function scoreDrawResult(state: GameState, status: 'DRAW_BY_BIKJANG' | 'DRAW_BY_REPETITION', reason: string): GameResult {
  const winner = scoreWinner(state)
  return {
    status,
    winner,
    loser: winner === null ? null : otherSide(winner),
    reason,
  }
}

export function getGameResult(state: GameState): GameResult {
  if (isCheckmate(state, state.turn)) {
    return {
      status: 'CHECKMATE',
      winner: otherSide(state.turn),
      loser: state.turn,
      reason: `${state.turn} is checkmated`,
    }
  }
  if (state.config.bikjangEnabled && isBikjang(state)) return scoreDrawResult(state, 'DRAW_BY_BIKJANG', 'Bikjang')
  const currentKey = positionKey(state.board, state.turn)
  const repetitions = state.positionHistory.filter((key) => key === currentKey).length
  if (repetitions >= state.config.repetitionLimit) return scoreDrawResult(state, 'DRAW_BY_REPETITION', 'Position repeated')
  return { status: 'PLAYING', winner: null, loser: null, reason: '' }
}