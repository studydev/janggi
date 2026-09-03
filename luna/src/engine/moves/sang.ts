import { getPiece, isInBoard } from '../board'
import type { Board, Position } from '../types'
import { addUniquePosition, canLand, DIAGONAL_DIRECTIONS, offsetPosition, ORTHOGONAL_DIRECTIONS } from './shared'

export function generateSangMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'SANG') return []

  const moves: Position[] = []
  for (const firstStep of ORTHOGONAL_DIRECTIONS) {
    const firstPoint = offsetPosition(position, firstStep.file, firstStep.rank)
    if (!isInBoard(firstPoint) || getPiece(board, firstPoint)) continue
    for (const diagonalStep of DIAGONAL_DIRECTIONS) {
      const secondPoint = offsetPosition(firstPoint, diagonalStep.file, diagonalStep.rank)
      if (!isInBoard(secondPoint) || getPiece(board, secondPoint)) continue
      const destination = offsetPosition(secondPoint, diagonalStep.file, diagonalStep.rank)
      if (canLand(board, destination, piece)) addUniquePosition(moves, destination)
    }
  }
  return moves
}