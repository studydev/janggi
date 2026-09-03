import { getPiece, isInBoard, shiftPosition } from '../board'
import type { Board, Position } from '../types'

const straightDirections: readonly Position[] = [
  { file: 0, rank: -1 },
  { file: 0, rank: 1 },
  { file: -1, rank: 0 },
  { file: 1, rank: 0 },
]

export function generateSangMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'SANG') {
    return []
  }

  const moves: Position[] = []
  for (const straightDirection of straightDirections) {
    const firstStep = shiftPosition(position, straightDirection.file, straightDirection.rank)
    if (!isInBoard(firstStep) || getPiece(board, firstStep) !== null) {
      continue
    }

    const lateralDirections =
      straightDirection.file === 0
        ? [{ file: -1, rank: 0 }, { file: 1, rank: 0 }]
        : [{ file: 0, rank: -1 }, { file: 0, rank: 1 }]

    for (const lateralDirection of lateralDirections) {
      const diagonalStep = {
        file: straightDirection.file + lateralDirection.file,
        rank: straightDirection.rank + lateralDirection.rank,
      }
      const secondStep = shiftPosition(firstStep, diagonalStep.file, diagonalStep.rank)
      if (!isInBoard(secondStep) || getPiece(board, secondStep) !== null) {
        continue
      }

      const destination = shiftPosition(secondStep, diagonalStep.file, diagonalStep.rank)
      if (!isInBoard(destination)) {
        continue
      }

      const occupyingPiece = getPiece(board, destination)
      if (occupyingPiece?.side !== piece.side) {
        moves.push(destination)
      }
    }
  }

  return moves
}