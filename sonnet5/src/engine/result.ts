// 승패/무승부 판정과 기물 점수 계산.
import { pieceAt, positionKey } from './board'
import { SIDE_NAME_KO } from './pieceLabels'
import { findGung, generateLegalMoves, isCheck } from './rules'
import type { GameState, PieceType, Side } from './types'

export type GameStatus = 'PLAYING' | 'CHECKMATE' | 'DRAW_BY_BIKJANG' | 'DRAW_BY_REPETITION'

export interface GameResult {
  readonly status: GameStatus
  readonly winner: Side | null
  readonly reason: string
}

const PIECE_SCORE: Record<PieceType, number> = { CHA: 13, PO: 7, MA: 5, SANG: 3, SA: 3, JOL: 2, GUNG: 0 }
/** 한(漢) 진영이 후수(선수는 초)인 데 대한 보상 점수(덤). */
const HAN_DEOK = 1.5

export function calculateScore(state: GameState, side: Side): number {
  let score = 0
  for (const piece of state.board) {
    if (piece && piece.side === side) score += PIECE_SCORE[piece.type]
  }
  if (side === 'HAN') score += HAN_DEOK
  return score
}

/** 빅장: 양 궁이 같은 file에서 사이에 기물 없이 마주보는 상태. */
export function isBikjang(state: GameState): boolean {
  const hanGung = findGung(state.board, 'HAN')
  const choGung = findGung(state.board, 'CHO')
  if (!hanGung || !choGung || hanGung.file !== choGung.file) return false
  const minRank = Math.min(hanGung.rank, choGung.rank)
  const maxRank = Math.max(hanGung.rank, choGung.rank)
  for (let rank = minRank + 1; rank < maxRank; rank++) {
    if (pieceAt(state.board, { file: hanGung.file, rank })) return false
  }
  return true
}

export function hasLegalMoves(state: GameState): boolean {
  return generateLegalMoves(state).length > 0
}

/** 외통(체크메이트): 장군 상태이면서 둘 수 있는 합법수가 없다. (한 수 쉬기로 회피할 수 없다) */
export function isCheckmate(state: GameState): boolean {
  return isCheck(state, state.turn) && !hasLegalMoves(state)
}

export function getRepetitionCount(state: GameState): number {
  const key = positionKey(state.board, state.turn)
  return state.positionCounts[key] ?? 1
}

function resolveByScore(state: GameState, status: GameStatus, triggerReason: string): GameResult {
  const hanScore = calculateScore(state, 'HAN')
  const choScore = calculateScore(state, 'CHO')
  if (hanScore === choScore) {
    return { status, winner: null, reason: `${triggerReason} 점수도 ${hanScore}점으로 같아 무승부입니다.` }
  }
  const winner: Side = hanScore > choScore ? 'HAN' : 'CHO'
  return {
    status,
    winner,
    reason: `${triggerReason} 점수 판정 결과 한 ${hanScore}점, 초 ${choScore}점으로 ${SIDE_NAME_KO[winner]}이 승리했습니다.`,
  }
}

export function getGameResult(state: GameState): GameResult {
  if (isCheckmate(state)) {
    const winner = state.turn === 'HAN' ? 'CHO' : 'HAN'
    return { status: 'CHECKMATE', winner, reason: `${SIDE_NAME_KO[state.turn]}이 외통(체크메이트)에 걸렸습니다.` }
  }
  if (state.config.bikjangIsDraw && isBikjang(state)) {
    return resolveByScore(state, 'DRAW_BY_BIKJANG', '빅장(양 궁이 마주봄)이 발생했습니다.')
  }
  if (getRepetitionCount(state) >= state.config.repetitionLimit) {
    return resolveByScore(state, 'DRAW_BY_REPETITION', '동일 국면이 반복되었습니다.')
  }
  return { status: 'PLAYING', winner: null, reason: '' }
}
