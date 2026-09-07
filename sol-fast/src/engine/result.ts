import {
  getPiece,
  positionHash,
  toPosition,
} from './board'
import { findGeneral, generateLegalMoves, isCheck } from './rules'
import type { GameResult, GameState, PieceType, Side } from './types'

const PIECE_SCORES: Record<PieceType, number> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
}

export function calculateScore(state: GameState, side: Side): number {
  const material = state.board.reduce((score, piece) => (
    piece?.side === side ? score + PIECE_SCORES[piece.type] : score
  ), 0)
  return material + (side === 'HAN' ? 1.5 : 0)
}

export function isCheckmate(state: GameState, side: Side): boolean {
  return isCheck(state, side) && generateLegalMoves(state, side).length === 0
}

export function isBikjang(state: GameState): boolean {
  if (!state.config.bikjang) return false
  const hanGeneral = findGeneral(state.board, 'HAN')
  const choGeneral = findGeneral(state.board, 'CHO')
  if (!hanGeneral || !choGeneral || hanGeneral.file !== choGeneral.file) return false

  const firstRank = Math.min(hanGeneral.rank, choGeneral.rank) + 1
  const lastRank = Math.max(hanGeneral.rank, choGeneral.rank)
  for (let rank = firstRank; rank < lastRank; rank += 1) {
    const position = toPosition(hanGeneral.file, rank)
    if (position && getPiece(state.board, position)) return false
  }
  return true
}

export function isRepetition(state: GameState): boolean {
  const current = positionHash(state.board, state.turn)
  return state.positionHistory.filter((hash) => hash === current).length
    >= state.config.repetitionCount
}

function scoreDecision(state: GameState, trigger: string): GameResult {
  const hanScore = calculateScore(state, 'HAN')
  const choScore = calculateScore(state, 'CHO')
  const winner = hanScore === choScore ? null : hanScore > choScore ? 'HAN' : 'CHO'
  const winnerLabel = winner === 'HAN' ? '한' : winner === 'CHO' ? '초' : null

  return {
    status: 'DRAW_BY_SCORE',
    winner,
    reason: winnerLabel
      ? `${trigger} · ${winnerLabel} 점수승 (${hanScore} : ${choScore})`
      : `${trigger} · 동점 무승부 (${hanScore} : ${choScore})`,
  }
}

export function getGameResult(state: GameState): GameResult {
  if (isCheckmate(state, state.turn)) {
    const winner = state.turn === 'HAN' ? 'CHO' : 'HAN'
    return {
      status: 'CHECKMATE',
      winner,
      reason: `${winner === 'HAN' ? '한' : '초'} 외통승`,
    }
  }
  if (isBikjang(state)) return scoreDecision(state, '빅장')
  if (isRepetition(state)) return scoreDecision(state, '동일 국면 반복')
  return { status: 'PLAYING', winner: null, reason: '' }
}
