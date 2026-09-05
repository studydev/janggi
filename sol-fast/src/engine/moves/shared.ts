import { getPiece, isInBoard } from '../board'
import type { Board, Position, Side } from '../types'

export interface Direction {
  readonly file: number
  readonly rank: number
}

export const ORTHOGONAL_DIRECTIONS: readonly Direction[] = [
  { file: 0, rank: -1 },
  { file: 1, rank: 0 },
  { file: 0, rank: 1 },
  { file: -1, rank: 0 },
]

export function canLand(board: Board, position: Position, side: Side): boolean {
  const target = getPiece(board, position)
  return target === null || target.side !== side
}

export function generateSlidingMoves(
  board: Board,
  from: Position,
  side: Side,
  directions: readonly Direction[],
  isValidTarget: (position: Position) => boolean = isInBoard,
): Position[] {
  const moves: Position[] = []

  for (const direction of directions) {
    let target = {
      file: from.file + direction.file,
      rank: from.rank + direction.rank,
    }
    while (isInBoard(target) && isValidTarget(target)) {
      const occupant = getPiece(board, target)
      if (!occupant) {
        moves.push(target)
      } else {
        if (occupant.side !== side) moves.push(target)
        break
      }
      target = {
        file: target.file + direction.file,
        rank: target.rank + direction.rank,
      }
    }
  }

  return moves
}
