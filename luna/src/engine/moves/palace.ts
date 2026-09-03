import { getPiece, isInPalace, isOnPalaceDiagonal, isPalaceDiagonalStep } from '../board'
import type { Board, PieceType, Position } from '../types'
import { canLand, DIAGONAL_DIRECTIONS, offsetPosition, ORTHOGONAL_DIRECTIONS } from './shared'

export function generatePalaceMoves(board: Board, position: Position, type: PieceType): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== type || (type !== 'GUNG' && type !== 'SA')) return []

  const moves: Position[] = []
  for (const direction of ORTHOGONAL_DIRECTIONS) {
    const destination = offsetPosition(position, direction.file, direction.rank)
    if (isInPalace(destination, piece.side) && canLand(board, destination, piece)) moves.push(destination)
  }
  if (isOnPalaceDiagonal(position)) {
    for (const direction of DIAGONAL_DIRECTIONS) {
      const destination = offsetPosition(position, direction.file, direction.rank)
      if (isPalaceDiagonalStep(position, destination) && canLand(board, destination, piece)) moves.push(destination)
    }
  }
  return moves
}

export function generateGungMoves(board: Board, position: Position): Position[] {
  return generatePalaceMoves(board, position, 'GUNG')
}

export function generateSaMoves(board: Board, position: Position): Position[] {
  return generatePalaceMoves(board, position, 'SA')
}