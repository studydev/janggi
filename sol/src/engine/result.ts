import { getPiece, hashPosition, indexToPosition, oppositeSide } from './board'
import { generateLegalMoves, isCheck } from './rules'
import type { GameState, PieceType, Position, Side } from './types'

const PIECE_SCORES: Record<PieceType, number> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
}

export type GameStatus =
  | 'PLAYING'
  | 'CHECKMATE'
  | 'DRAW_BY_SCORE'
  | 'DRAW'
  | 'RESIGNATION'
  | 'AGREED_DRAW'

export interface GameResult {
  readonly status: GameStatus
  readonly winner: Side | null
  readonly reason: string
}

function findGung(state: GameState, side: Side): Position | null {
  const index = state.board.findIndex((piece) => piece?.side === side && piece.type === 'GUNG')
  return index < 0 ? null : indexToPosition(index)
}

export function isCheckmate(state: GameState, side: Side): boolean {
  return isCheck(state, side) && generateLegalMoves(state, side).length === 0
}

export function isBikjang(state: GameState): boolean {
  if (!state.config.bikjangEnabled) return false
  const hanGung = findGung(state, 'HAN')
  const choGung = findGung(state, 'CHO')
  if (!hanGung || !choGung || hanGung.file !== choGung.file) return false

  const firstRank = Math.min(hanGung.rank, choGung.rank) + 1
  const lastRank = Math.max(hanGung.rank, choGung.rank)
  for (let rank = firstRank; rank < lastRank; rank += 1) {
    if (getPiece(state.board, { file: hanGung.file, rank })) return false
  }
  return true
}

export function isRepetition(state: GameState): boolean {
  const current = hashPosition(state.board, state.turn)
  return state.positionHistory.filter((position) => position === current).length >= state.config.repetitionCount
}

export function calculateScore(state: GameState, side: Side): number {
  const material = state.board.reduce(
    (score, piece) => score + (piece?.side === side ? PIECE_SCORES[piece.type] : 0),
    0,
  )
  return material + (side === 'HAN' ? 1.5 : 0)
}

function settleByScore(state: GameState, trigger: string): GameResult {
  const hanScore = calculateScore(state, 'HAN')
  const choScore = calculateScore(state, 'CHO')
  if (hanScore === choScore) {
    return {
      status: 'DRAW',
      winner: null,
      reason: `${trigger}, 점수 동률`,
    }
  }
  return {
    status: 'DRAW_BY_SCORE',
    winner: hanScore > choScore ? 'HAN' : 'CHO',
    reason: `${trigger}, 점수 우세`,
  }
}

export function getGameResult(state: GameState): GameResult {
  if (isCheckmate(state, state.turn)) {
    return {
      status: 'CHECKMATE',
      winner: oppositeSide(state.turn),
      reason: '외통',
    }
  }
  if (isBikjang(state)) return settleByScore(state, '빅장')
  if (isRepetition(state)) return settleByScore(state, '동일 국면 반복')
  return {
    status: 'PLAYING',
    winner: null,
    reason: '',
  }
}