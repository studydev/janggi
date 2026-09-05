import { getPiece } from '../board'
import type { Board, Position } from '../types'
import { raysFrom } from './shared'

export function generateChaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece?.type !== 'CHA') return []
  const moves: Position[] = []
  for (const ray of raysFrom(position)) {
    for (const target of ray) {
      const occupant = getPiece(board, target)
      if (occupant?.side !== piece.side) moves.push(target)
      if (occupant) break
    }
  }
  return moves
}