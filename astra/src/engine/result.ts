import { getPiece, hashPosition, oppositeSide } from './board'
import { findGung, generateLegalMoves, isCheck } from './rules'
import type { GameState, PieceType, Side } from './types'

export const PIECE_POINTS: Record<PieceType, number> = { CHA: 13, PO: 7, MA: 5, SANG: 3, SA: 3, JOL: 2, GUNG: 0 }
export type ResultReason = 'NONE' | 'CHECKMATE' | 'BIKJANG' | 'REPETITION' | 'AGREEMENT' | 'RESIGNATION'
export interface GameResult {
  readonly status: 'PLAYING' | 'CHECKMATE' | 'DRAW_BY_SCORE' | 'RESIGNED'
  readonly winner: Side | null
  readonly reason: ResultReason
  readonly scores: Readonly<Record<Side, number>>
}

export function calculateScore(state: GameState, side: Side): number {
  return state.board.reduce((score, piece) => score + (piece?.side === side ? PIECE_POINTS[piece.type] : 0), side === 'HAN' ? 1.5 : 0)
}

export function isCheckmate(state: GameState, side: Side): boolean {
  return isCheck(state, side) && generateLegalMoves(state, side).length === 0
}

export function isBikjang(state: GameState): boolean {
  if (!state.config.bikjangEnabled) return false
  const han = findGung(state.board, 'HAN')
  const cho = findGung(state.board, 'CHO')
  if (!han || !cho || han.file !== cho.file) return false
  for (let rank = Math.min(han.rank, cho.rank) + 1; rank < Math.max(han.rank, cho.rank); rank += 1) {
    if (getPiece(state.board, { file: han.file, rank })) return false
  }
  return true
}

function scoresFor(state: GameState): Record<Side, number> {
  return { HAN: calculateScore(state, 'HAN'), CHO: calculateScore(state, 'CHO') }
}

function scoreResult(state: GameState, reason: 'BIKJANG' | 'REPETITION' | 'AGREEMENT'): GameResult {
  const scores = scoresFor(state)
  const winner = scores.HAN === scores.CHO ? null : scores.HAN > scores.CHO ? 'HAN' : 'CHO'
  return { status: 'DRAW_BY_SCORE', reason, winner, scores }
}

export function getGameResult(state: GameState): GameResult {
  if (isCheckmate(state, state.turn)) {
    return { status: 'CHECKMATE', reason: 'CHECKMATE', winner: oppositeSide(state.turn), scores: scoresFor(state) }
  }
  if (isBikjang(state)) return scoreResult(state, 'BIKJANG')
  const position = hashPosition(state.board, state.turn)
  if (state.positionHistory.filter((entry) => entry === position).length >= state.config.repetitionCount) {
    return scoreResult(state, 'REPETITION')
  }
  return { status: 'PLAYING', reason: 'NONE', winner: null, scores: scoresFor(state) }
}

export function scoreAgreement(state: GameState): GameResult {
  if (getGameResult(state).status !== 'PLAYING') throw new Error('Game already ended')
  return scoreResult(state, 'AGREEMENT')
}

export function resignGame(state: GameState): GameResult {
  if (getGameResult(state).status !== 'PLAYING') throw new Error('Game already ended')
  return { status: 'RESIGNED', reason: 'RESIGNATION', winner: oppositeSide(state.turn), scores: scoresFor(state) }
}