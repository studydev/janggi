/**
 * 궁(將)·사(士) 의사이동. 두 기물의 이동 규칙은 완전히 동일하다.
 *
 * RULES.md: 궁성 안에서만 선을 따라 1칸. 궁성 대각선 위에서는 대각으로도 1칸.
 * 궁성을 벗어날 수 없다.
 */

import { isInPalace, isPalaceDiagonalStep, pieceAt, shift } from '../board'
import type { Board, Position } from '../types'
import { canLandOn, DIAGONAL, ORTHOGONAL } from './common'

function palacePieceMoves(board: Board, from: Position, want: 'GUNG' | 'SA'): Position[] {
  const mover = pieceAt(board, from)
  if (mover === null || mover.type !== want) return []

  const moves: Position[] = []

  // 가로·세로 1칸 — 궁성 안에 머물러야 한다.
  for (const dir of ORTHOGONAL) {
    const dest = shift(from, dir.df, dir.dr)
    if (isInPalace(dest, mover.side) && canLandOn(board, dest, mover)) {
      moves.push(dest)
    }
  }

  // 대각 1칸 — 궁성 대각선 위에서만.
  for (const dir of DIAGONAL) {
    const dest = shift(from, dir.df, dir.dr)
    if (isPalaceDiagonalStep(from, dest) && isInPalace(dest, mover.side) && canLandOn(board, dest, mover)) {
      moves.push(dest)
    }
  }

  return moves
}

export function generateGungMoves(board: Board, from: Position): Position[] {
  return palacePieceMoves(board, from, 'GUNG')
}

export function generateSaMoves(board: Board, from: Position): Position[] {
  return palacePieceMoves(board, from, 'SA')
}
