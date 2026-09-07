import {
  forwardDir,
  getPiece,
  isInPalace,
  oppositeSide,
  toPosition,
} from '../board'
import type { Board, Position } from '../types'
import { canLand } from './common'

export function generateJolMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'JOL') return []

  const forward = forwardDir(piece.side)
  const candidates = [
    toPosition(position.file, position.rank + forward),
    toPosition(position.file - 1, position.rank),
    toPosition(position.file + 1, position.rank),
  ]

  if (isInPalace(position, oppositeSide(piece.side))) {
    candidates.push(
      toPosition(position.file - 1, position.rank + forward),
      toPosition(position.file + 1, position.rank + forward),
    )
  }

  return candidates.filter((destination): destination is Position => (
    destination !== null
    && canLand(board, destination, piece.side)
  )).filter((destination) => {
    const isDiagonal = destination.file !== position.file && destination.rank !== position.rank
    if (!isDiagonal) return true

    const centerRank = piece.side === 'CHO' ? 2 : 9
    const fromOffset = Math.abs(position.file - 5) === Math.abs(position.rank - centerRank)
    const toOffset = Math.abs(destination.file - 5) === Math.abs(destination.rank - centerRank)
    return fromOffset && toOffset
  })
}
