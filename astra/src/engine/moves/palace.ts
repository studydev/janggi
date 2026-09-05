import { getPalaceDiagonalNeighbors, getPiece, isInPalace } from '../board'
import type { Board, Position } from '../types'
import { canLand, ORTHOGONAL_DIRECTIONS } from './shared'

export function generatePalaceMoves(board: Board, position: Position, type: 'GUNG' | 'SA'): Position[] {
  const piece = getPiece(board, position)
  if (piece?.type !== type || !isInPalace(position, piece.side)) return []
  return [
    ...ORTHOGONAL_DIRECTIONS.map((direction) => ({ file: position.file + direction.file, rank: position.rank + direction.rank })),
    ...getPalaceDiagonalNeighbors(position),
  ].filter((target) => isInPalace(target, piece.side) && canLand(board, target, piece.side))
}