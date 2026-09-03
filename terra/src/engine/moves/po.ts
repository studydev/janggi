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

export function generatePoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'PO') {
    return []
  }

  const moves: Position[] = []
  const collectLine = (direction: Position, palaceOnly: boolean): void => {
    let current = position
    let crossedScreen = false

    while (true) {
      const next = shiftPosition(current, direction.file, direction.rank)
      if (!isInBoard(next) || (palaceOnly && !isPalaceDiagonalStep(current, next))) {
        return
      }

      const target = getPiece(board, next)
      if (!crossedScreen) {
        if (target === null) {
          current = next
          continue
        }
        if (target.type === 'PO') {
          return
        }
        crossedScreen = true
        current = next
        continue
      }

      if (target === null) {
        moves.push(next)
        current = next
        continue
      }

      if (target.side !== piece.side && target.type !== 'PO') {
        moves.push(next)
      }
      return
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