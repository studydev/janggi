/**
 * 마(馬) 의사이동.
 *
 * RULES.md: 직선 1칸 + 대각 1칸 (총 2칸). 첫 직선 칸(다리)에 기물이 있으면
 * 막혀서 못 간다. 궁성·강 개념 없음.
 */

import { inBounds, isInBoard, pieceAt, shift } from '../board'
import type { Board, Position } from '../types'
import { canLandOn } from './common'

interface Hop {
  readonly leg: { df: number; dr: number }
  readonly targets: readonly { df: number; dr: number }[]
}

const HOPS: readonly Hop[] = [
  { leg: { df: 0, dr: -1 }, targets: [{ df: -1, dr: -2 }, { df: 1, dr: -2 }] },
  { leg: { df: 0, dr: 1 }, targets: [{ df: -1, dr: 2 }, { df: 1, dr: 2 }] },
  { leg: { df: -1, dr: 0 }, targets: [{ df: -2, dr: -1 }, { df: -2, dr: 1 }] },
  { leg: { df: 1, dr: 0 }, targets: [{ df: 2, dr: -1 }, { df: 2, dr: 1 }] },
]

export function generateMaMoves(board: Board, from: Position): Position[] {
  const mover = pieceAt(board, from)
  if (mover === null || mover.type !== 'MA') return []

  const moves: Position[] = []
  for (const hop of HOPS) {
    const leg = shift(from, hop.leg.df, hop.leg.dr)
    if (!isInBoard(leg) || pieceAt(board, leg) !== null) continue // 다리 막힘.

    for (const t of hop.targets) {
      const dest = shift(from, t.df, t.dr)
      if (inBounds(dest.file, dest.rank) && canLandOn(board, dest, mover)) {
        moves.push(dest)
      }
    }
  }
  return moves
}
