import { getPalaceDiagonalNeighbors, getPiece, isInPalace } from '../board'
import type { Board, PieceType, Position } from '../types'
import { canLand, ORTHOGONAL_DIRECTIONS } from './shared'

export function generatePalacePieceMoves(
  board: Board,
  position: Position,
  expectedType: PieceType,
): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== expectedType || !isInPalace(position, piece.side)) return []

  const orthogonal = ORTHOGONAL_DIRECTIONS.map((direction) => ({
    file: position.file + direction.file,
    rank: position.rank + direction.rank,
  })).filter(
    (target) => isInPalace(target, piece.side) && canLand(board, target, piece.side),
  )
  const diagonal = getPalaceDiagonalNeighbors(position).filter(
    (target) => isInPalace(target, piece.side) && canLand(board, target, piece.side),
  )

  return [...orthogonal, ...diagonal]
}
