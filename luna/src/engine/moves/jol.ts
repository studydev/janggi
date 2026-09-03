import { getPiece, isInPalace, isPalaceDiagonalStep, forwardDir } from '../board'
import type { Board, Position } from '../types'
import { canLand, offsetPosition } from './shared'

export function generateJolMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'JOL') return []

  const direction = forwardDir(piece.side)
  const candidates = [
    offsetPosition(position, 0, direction),
    offsetPosition(position, -1, 0),
    offsetPosition(position, 1, 0),
  ]
  if (isInPalace(position, piece.side === 'HAN' ? 'CHO' : 'HAN')) {
    candidates.push(offsetPosition(position, -1, direction), offsetPosition(position, 1, direction))
  }

  return candidates.filter(
    (destination, index) =>
      canLand(board, destination, piece) &&
      (index < 3 || isPalaceDiagonalStep(position, destination)),
  )
}