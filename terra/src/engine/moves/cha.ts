import {
  getPiece,
  isInBoard,
  isPalaceDiagonalStep,
  palaceDiagonalDirections,
  shiftPosition,
} from '../board'
import type { Board, Position } from '../types'

const orthogonalDirections: readonly Position[] = [
  { file: 0, rank: -1 },
  { file: 0, rank: 1 },
  { file: -1, rank: 0 },
  { file: 1, rank: 0 },
]

export function generateChaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'CHA') {
    return []
  }

  const moves: Position[] = []
  const collectLine = (direction: Position, palaceOnly: boolean): void => {
    let current = position
    let next = shiftPosition(current, direction.file, direction.rank)

    while (isInBoard(next) && (!palaceOnly || isPalaceDiagonalStep(current, next))) {
      const target = getPiece(board, next)
      if (target?.side === piece.side) {
        return
      }

      moves.push(next)
      if (target !== null) {
        return
      }

      current = next
      next = shiftPosition(current, direction.file, direction.rank)
    }
  }

  for (const direction of orthogonalDirections) {
    collectLine(direction, false)
  }

  for (const direction of palaceDiagonalDirections(position)) {
    collectLine(direction, true)
  }

  return moves
}