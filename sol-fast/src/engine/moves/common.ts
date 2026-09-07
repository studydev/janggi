import {
  getPiece,
  palaceSideAt,
  toPosition,
} from '../board'
import type { Board, Position, Side } from '../types'

export const ORTHOGONAL_DIRECTIONS = [
  { file: 1, rank: 0 },
  { file: -1, rank: 0 },
  { file: 0, rank: 1 },
  { file: 0, rank: -1 },
] as const

export function canLand(board: Board, position: Position, side: Side): boolean {
  return getPiece(board, position)?.side !== side
}

export function getOrthogonalRay(
  position: Position,
  fileDirection: number,
  rankDirection: number,
): Position[] {
  const ray: Position[] = []
  let distance = 1

  while (true) {
    const next = toPosition(
      position.file + fileDirection * distance,
      position.rank + rankDirection * distance,
    )
    if (!next) return ray
    ray.push(next)
    distance += 1
  }
}

export function getPalaceDiagonalRays(position: Position): Position[][] {
  const palaceSide = palaceSideAt(position)
  if (!palaceSide) return []

  const centerRank = palaceSide === 'HAN' ? 2 : 9
  const center = toPosition(5, centerRank)
  if (!center) return []

  if (position.file === 5 && position.rank === centerRank) {
    const cornerRanks = [centerRank - 1, centerRank + 1]
    return cornerRanks.flatMap((rank) => [4, 6]
      .map((file) => toPosition(file, rank))
      .filter((corner): corner is Position => corner !== null)
      .map((corner) => [corner]))
  }

  const isCorner = Math.abs(position.file - 5) === 1
    && Math.abs(position.rank - centerRank) === 1
  if (!isCorner) return []

  const opposite = toPosition(10 - position.file, centerRank * 2 - position.rank)
  return opposite ? [[center, opposite]] : []
}

export function collectSlidingMoves(
  board: Board,
  side: Side,
  ray: ReadonlyArray<Position>,
): Position[] {
  const moves: Position[] = []
  for (const destination of ray) {
    const target = getPiece(board, destination)
    if (!target) {
      moves.push(destination)
      continue
    }
    if (target.side !== side) moves.push(destination)
    break
  }
  return moves
}
