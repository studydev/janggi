/** Shared helpers for the per-piece pseudo-move generators. */

import { pieceAt } from '../board'
import type { Board, Piece, Position } from '../types'

export interface Dir {
  readonly df: number
  readonly dr: number
}

/** 가로·세로 네 방향. */
export const ORTHOGONAL: readonly Dir[] = [
  { df: 0, dr: -1 },
  { df: 0, dr: 1 },
  { df: -1, dr: 0 },
  { df: 1, dr: 0 },
]

/** 대각 네 방향. */
export const DIAGONAL: readonly Dir[] = [
  { df: -1, dr: -1 },
  { df: -1, dr: 1 },
  { df: 1, dr: -1 },
  { df: 1, dr: 1 },
]

/** 도착 칸이 비었거나 적 기물이면 이동 가능 (아군이면 불가). */
export function canLandOn(board: Board, pos: Position, mover: Piece): boolean {
  const target = pieceAt(board, pos)
  return target === null || target.side !== mover.side
}
