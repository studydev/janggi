import { fromIndex, getPiece, positionKey } from './board'
import { generateLegalMoves, isCheck } from './rules'
import type { Board, GameState, PieceType, Position, Side } from './types'

export type GameResultStatus = 'PLAYING' | 'CHECKMATE' | 'DRAW_BY_SCORE' | 'DRAW'

export interface GameResult {
  status: GameResultStatus
  winner: Side | null
  reason: string | null
}

const pieceValues: Record<PieceType, number> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
}

function findGung(board: Board, side: Side): Position | null {
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece?.side === side && piece.type === 'GUNG') {
      return fromIndex(index)
    }
  }
  return null
}

export function isCheckmate(state: GameState, side: Side): boolean {
  return state.turn === side && isCheck(state, side) && generateLegalMoves(state).length === 0
}

export function isBikjang(state: GameState): boolean {
  const hanGung = findGung(state.board, 'HAN')
  const choGung = findGung(state.board, 'CHO')
  if (hanGung === null || choGung === null || hanGung.file !== choGung.file) {
    return false
  }

  const topRank = Math.min(hanGung.rank, choGung.rank)
  const bottomRank = Math.max(hanGung.rank, choGung.rank)
  for (let rank = topRank + 1; rank < bottomRank; rank += 1) {
    if (getPiece(state.board, { file: hanGung.file, rank }) !== null) {
      return false
    }
  }
  return true
}

export function isRepeatedPosition(state: GameState): boolean {
  const currentKey = positionKey(state.board, state.turn)
  const occurrences = state.positionHistory.filter((key) => key === currentKey).length
  return occurrences >= state.config.repetitionLimit
}

export function calculateScore(state: GameState, side: Side): number {
  const materialScore = state.board.reduce((score, piece) => {
    return piece?.side === side ? score + pieceValues[piece.type] : score
  }, 0)
  return materialScore + (side === 'HAN' ? 1.5 : 0)
}

function scoreResult(state: GameState, reason: string): GameResult {
  const hanScore = calculateScore(state, 'HAN')
  const choScore = calculateScore(state, 'CHO')
  if (hanScore === choScore) {
    return { status: 'DRAW', winner: null, reason }
  }
  return {
    status: 'DRAW_BY_SCORE',
    winner: hanScore > choScore ? 'HAN' : 'CHO',
    reason,
  }
}

export function resolveScoreDraw(state: GameState, reason: string): GameResult {
  return scoreResult(state, reason)
}

export function getGameResult(state: GameState): GameResult {
  if (isCheckmate(state, state.turn)) {
    return {
      status: 'CHECKMATE',
      winner: state.turn === 'HAN' ? 'CHO' : 'HAN',
      reason: '외통',
    }
  }

  if (state.config.bikjangEnabled && isBikjang(state)) {
    return scoreResult(state, '빅장')
  }

  if (isRepeatedPosition(state)) {
    return scoreResult(state, '동일 국면 반복')
  }

  return { status: 'PLAYING', winner: null, reason: null }
}