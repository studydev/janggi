/**
 * 상(象) 의사이동.
 *
 * RULES.md: 직선 1칸 + 대각 2칸 (총 3칸). 경로상 중간 두 지점 중 하나라도
 * 막히면 못 간다. (샹치와 달리 대각 2칸이며 강 개념 없음.)
 */

import { isInBoard, pieceAt, shift } from '../board'
import type { Board, Position } from '../types'
import { canLandOn, ORTHOGONAL } from './common'

export function generateSangMoves(board: Board, from: Position): Position[] {
  const mover = pieceAt(board, from)
  if (mover === null || mover.type !== 'SANG') return []

  const moves: Position[] = []
  for (const step of ORTHOGONAL) {
    const first = shift(from, step.df, step.dr)
    if (!isInBoard(first) || pieceAt(board, first) !== null) continue // 1번째 지점 막힘.

    // 직선 방향에 수직인 두 대각 방향.
    const laterals =
      step.df === 0
        ? [{ df: -1, dr: step.dr }, { df: 1, dr: step.dr }]
        : [{ df: step.df, dr: -1 }, { df: step.df, dr: 1 }]

    for (const diag of laterals) {
      const second = shift(first, diag.df, diag.dr)
      if (!isInBoard(second) || pieceAt(board, second) !== null) continue // 2번째 지점 막힘.

      const dest = shift(second, diag.df, diag.dr)
      if (isInBoard(dest) && canLandOn(board, dest, mover)) {
        moves.push(dest)
      }
    }
  }
  return moves
}
