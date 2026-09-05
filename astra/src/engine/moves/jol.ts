import { forwardDir, getPalaceDiagonalNeighbors, getPiece, isInPalace, oppositeSide } from '../board'
import type { Board, Position } from '../types'
import { canLand } from './shared'

export function generateJolMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece?.type !== 'JOL') return []
  const forward = forwardDir(piece.side)
  const candidates: Position[] = [
    { file: position.file, rank: position.rank + forward },
    { file: position.file - 1, rank: position.rank },
    { file: position.file + 1, rank: position.rank },
  ]
  if (isInPalace(position, oppositeSide(piece.side))) {
    candidates.push(...getPalaceDiagonalNeighbors(position).filter((target) => target.rank - position.rank === forward))
  }
  return candidates.filter((target) => canLand(board, target, piece.side))
}