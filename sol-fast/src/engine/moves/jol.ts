import {
  forwardDir,
  getPalaceDiagonalNeighbors,
  getPiece,
  isInBoard,
  isInPalace,
  isOnPalaceDiagonal,
  oppositeSide,
} from '../board'
import type { Board, Position } from '../types'
import { canLand } from './shared'

export function generateJolMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'JOL') return []

  const forward = forwardDir(piece.side)
  const candidates: Position[] = [
    { file: position.file, rank: position.rank + forward },
    { file: position.file - 1, rank: position.rank },
    { file: position.file + 1, rank: position.rank },
  ]
  const enemyPalace = oppositeSide(piece.side)
  if (isInPalace(position, enemyPalace) && isOnPalaceDiagonal(position)) {
    candidates.push(
      ...getPalaceDiagonalNeighbors(position).filter(
        (neighbor) => neighbor.rank - position.rank === forward,
      ),
    )
  }

  return candidates.filter(
    (target) => isInBoard(target) && canLand(board, target, piece.side),
  )
}