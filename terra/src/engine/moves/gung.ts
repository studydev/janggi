import { getPiece, isInPalace, isPalaceDiagonalStep, shiftPosition } from '../board'
import type { Board, PieceType, Position } from '../types'

const orthogonalDirections: readonly Position[] = [
  { file: 0, rank: -1 },
  { file: 0, rank: 1 },
  { file: -1, rank: 0 },
  { file: 1, rank: 0 },
]

const diagonalDirections: readonly Position[] = [
  { file: -1, rank: -1 },
  { file: -1, rank: 1 },
  { file: 1, rank: -1 },
  { file: 1, rank: 1 },
]

function generatePalaceMoves(board: Board, position: Position, expectedType: PieceType): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== expectedType || !isInPalace(position, piece.side)) {
    return []
  }

  const moves: Position[] = []
  for (const direction of orthogonalDirections) {
    const destination = shiftPosition(position, direction.file, direction.rank)
    if (!isInPalace(destination, piece.side)) {
      continue
    }

    const target = getPiece(board, destination)
    if (target?.side !== piece.side) {
      moves.push(destination)
    }
  }

  for (const direction of diagonalDirections) {
    const destination = shiftPosition(position, direction.file, direction.rank)
    if (!isPalaceDiagonalStep(position, destination)) {
      continue
    }

    const target = getPiece(board, destination)
    if (target?.side !== piece.side) {
      moves.push(destination)
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