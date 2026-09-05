import { getPalaceDiagonalNeighbors, getPiece, isInBoard, isInPalace, palaceSideAt } from '../board'
import type { Board, Position, Side } from '../types'

export const ORTHOGONAL_DIRECTIONS: readonly Position[] = [
  { file: -1, rank: 0 }, { file: 1, rank: 0 }, { file: 0, rank: -1 }, { file: 0, rank: 1 },
]

export function canLand(board: Board, position: Position, side: Side): boolean {
  return isInBoard(position) && getPiece(board, position)?.side !== side
}

export function raysFrom(position: Position): Position[][] {
  const palace = palaceSideAt(position)
  const directions = [
    ...ORTHOGONAL_DIRECTIONS.map((direction) => ({ ...direction, diagonal: false })),
    ...getPalaceDiagonalNeighbors(position).map((neighbor) => ({
      file: neighbor.file - position.file, rank: neighbor.rank - position.rank, diagonal: true,
    })),
  ]
  return directions.map((direction) => {
    const ray: Position[] = []
    let target = { file: position.file + direction.file, rank: position.rank + direction.rank }
    while (isInBoard(target) && (!direction.diagonal || (palace && isInPalace(target, palace)))) {
      ray.push(target)
      target = { file: target.file + direction.file, rank: target.rank + direction.rank }
    }
    return ray
  })
}