import {
  forwardDir,
  getPiece,
  isInBoard,
  isInPalace,
  isPalaceDiagonalStep,
  oppositeSide,
  shiftPosition,
} from '../board'
import type { Board, Position } from '../types'

export function generateJolMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'JOL') {
    return []
  }

  const forward = forwardDir(piece.side)
  const directions: Position[] = [
    { file: 0, rank: forward },
    { file: -1, rank: 0 },
    { file: 1, rank: 0 },
  ]

  if (isInPalace(position, oppositeSide(piece.side))) {
    for (const fileDelta of [-1, 1]) {
      const diagonalDestination = shiftPosition(position, fileDelta, forward)
      if (isPalaceDiagonalStep(position, diagonalDestination)) {
        directions.push({ file: fileDelta, rank: forward })
      }
    }
  }

  const moves: Position[] = []
  for (const direction of directions) {
    const destination = shiftPosition(position, direction.file, direction.rank)
    if (!isInBoard(destination)) {
      continue
    }

    const target = getPiece(board, destination)
    if (target?.side !== piece.side) {
      moves.push(destination)
    }
  }

  return moves
}