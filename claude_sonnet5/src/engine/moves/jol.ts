/**
 * 졸(卒)·병(兵) 의사이동.
 *
 * RULES.md: 앞 또는 좌우로 1칸. 뒤로 갈 수 없다. (샹치와 달리 처음부터 좌우 이동 가능.)
 * 상대 궁성 안의 대각선 위에서는 대각으로 전진할 수 있다.
 */

import { forwardDir, isInBoard, isInPalace, isPalaceDiagonalStep, opponent, pieceAt, shift } from '../board'
import type { Board, Position } from '../types'
import { canLandOn } from './common'

export function generateJolMoves(board: Board, from: Position): Position[] {
  const mover = pieceAt(board, from)
  if (mover === null || mover.type !== 'JOL') return []

  const fwd = forwardDir(mover.side)
  const dirs: { df: number; dr: number }[] = [
    { df: 0, dr: fwd }, // 전진
    { df: -1, dr: 0 }, // 좌
    { df: 1, dr: 0 }, // 우
  ]

  // 상대 궁성 대각선 위: 대각 전진 허용.
  if (isInPalace(from, opponent(mover.side))) {
    for (const df of [-1, 1]) {
      const dest = shift(from, df, fwd)
      if (isPalaceDiagonalStep(from, dest)) {
        dirs.push({ df, dr: fwd })
      }
    }
  }

  const moves: Position[] = []
  for (const dir of dirs) {
    const dest = shift(from, dir.df, dir.dr)
    if (isInBoard(dest) && canLandOn(board, dest, mover)) {
      moves.push(dest)
    }
  }
  return moves
}
