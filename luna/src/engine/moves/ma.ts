import { getPiece, isInBoard } from '../board'
import type { Board, Position } from '../types'
import { addUniquePosition, canLand, offsetPosition, ORTHOGONAL_DIRECTIONS } from './shared'

export function generateMaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'MA') return []

  const moves: Position[] = []
  for (const firstStep of ORTHOGONAL_DIRECTIONS) {
    const leg = offsetPosition(position, firstStep.file, firstStep.rank)
    if (isInBoard(leg) && !getPiece(board, leg)) {
      const diagonalSteps =
        firstStep.rank === 0
          ? [{ file: firstStep.file, rank: 1 }, { file: firstStep.file, rank: -1 }]
          : [{ file: 1, rank: firstStep.rank }, { file: -1, rank: firstStep.rank }]
      for (const diagonalStep of diagonalSteps) {
        const destination = offsetPosition(leg, diagonalStep.file, diagonalStep.rank)
        if (canLand(board, destination, piece)) addUniquePosition(moves, destination)
      }
    }
  }
  return moves
}