/**
 * 승패·무승부 판정.
 *
 * RULES.md:
 *  - 외통: 장군 상태이면서 둘 수 있는 합법수가 없다 (한 수 쉬기가 있으므로
 *    "장군이 아닌데 수가 없어서" 지는 스테일메이트는 존재하지 않는다).
 *  - 빅장: 양 궁이 같은 file 에서 사이에 기물 없이 마주봄. 기본 무승부 (config).
 *  - 같은 국면 반복: config.repetitionLimit 회 반복 시 무승부.
 *  - 무승부 조건 발생 시 점수가 높은 쪽이 승리한다 (동점이면 진짜 무승부).
 */

import { pieceAt, positionKey } from './board'
import { findGung, generateLegalMoves, isCheck, replayStates } from './rules'
import type { Board, GameState, Move, Side } from './types'
import { HAN_BONUS, PIECE_VALUE } from './types'

export type GameStatus = 'PLAYING' | 'CHECKMATE' | 'BIKJANG' | 'REPETITION'

export interface GameResult {
  readonly status: GameStatus
  /** 승자. null 이면 무승부. */
  readonly winner: Side | null
  readonly reason: string
  readonly scores: Readonly<Record<Side, number>>
}

// ---------------------------------------------------------------------------
// Checkmate / forced pass
// ---------------------------------------------------------------------------

function legalMovesFor(state: GameState, side: Side): Move[] {
  return generateLegalMoves(side === state.turn ? state : { ...state, turn: side })
}

/** side 가 외통인가 (장군 + 합법수 0). */
export function isCheckmate(state: GameState, side: Side): boolean {
  return isCheck(state.board, side) && legalMovesFor(state, side).length === 0
}

/** side 가 장군은 아니지만 둘 수 있는 수가 없어 반드시 쉬어야 하는가. */
export function mustPass(state: GameState, side: Side = state.turn): boolean {
  return !isCheck(state.board, side) && legalMovesFor(state, side).length === 0
}

// ---------------------------------------------------------------------------
// Bikjang (빅장)
// ---------------------------------------------------------------------------

export function isBikjang(state: GameState): boolean {
  const cho = findGung(state.board, 'CHO')
  const han = findGung(state.board, 'HAN')
  if (cho === null || han === null || cho.file !== han.file) return false

  const [lo, hi] = cho.rank < han.rank ? [cho.rank, han.rank] : [han.rank, cho.rank]
  for (let rank = lo + 1; rank < hi; rank += 1) {
    if (pieceAt(state.board, { file: cho.file, rank }) !== null) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Repetition
// ---------------------------------------------------------------------------

/** 초기 국면부터 현재까지의 (보드+차례) 해시 목록. */
export function positionKeyHistory(state: GameState): string[] {
  return replayStates(state.config, state.moveHistory).map((s) => positionKey(s.board, s.turn))
}

export function repetitionCount(state: GameState): number {
  const keys = positionKeyHistory(state)
  const current = keys[keys.length - 1]
  return keys.filter((k) => k === current).length
}

export function isRepetitionDraw(state: GameState): boolean {
  return repetitionCount(state) >= state.config.repetitionLimit
}

// ---------------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------------

export function calculateScore(board: Board, side: Side): number {
  let score = side === 'HAN' ? HAN_BONUS : 0
  for (const cell of board) {
    if (cell !== null && cell.side === side) score += PIECE_VALUE[cell.type]
  }
  return score
}

export function scores(board: Board): Record<Side, number> {
  return { CHO: calculateScore(board, 'CHO'), HAN: calculateScore(board, 'HAN') }
}

function winnerByScore(board: Board): Side | null {
  const s = scores(board)
  if (s.CHO > s.HAN) return 'CHO'
  if (s.HAN > s.CHO) return 'HAN'
  return null
}

// ---------------------------------------------------------------------------
// Aggregate result
// ---------------------------------------------------------------------------

export function getGameResult(state: GameState): GameResult {
  const board = state.board
  const currentScores = scores(board)

  // 1) 외통 — 둘 차례인 쪽이 외통이면 상대 승.
  if (isCheckmate(state, state.turn)) {
    return {
      status: 'CHECKMATE',
      winner: state.turn === 'CHO' ? 'HAN' : 'CHO',
      reason: `${state.turn === 'CHO' ? '초' : '한'} 외통`,
      scores: currentScores,
    }
  }

  // 2) 빅장 (설정 on).
  if (state.config.bikjangDraw && isBikjang(state)) {
    const w = winnerByScore(board)
    return {
      status: 'BIKJANG',
      winner: w,
      reason: w === null ? '빅장 (동점 무승부)' : `빅장 — 점수승 (${w === 'CHO' ? '초' : '한'})`,
      scores: currentScores,
    }
  }

  // 3) 국면 반복.
  if (isRepetitionDraw(state)) {
    const w = winnerByScore(board)
    return {
      status: 'REPETITION',
      winner: w,
      reason: w === null ? '국면 반복 (동점 무승부)' : `국면 반복 — 점수승 (${w === 'CHO' ? '초' : '한'})`,
      scores: currentScores,
    }
  }

  return { status: 'PLAYING', winner: null, reason: '', scores: currentScores }
}
