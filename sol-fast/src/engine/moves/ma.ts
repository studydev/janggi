import { getPiece, isInBoard } from '../board'
import type { Board, Position } from '../types'
import { canLand } from './shared'

interface MaRoute {
  readonly leg: Position
  readonly destinations: readonly Position[]
}

function routesFrom(position: Position): MaRoute[] {
  return [
    {
      leg: { file: position.file, rank: position.rank - 1 },
      destinations: [
        { file: position.file - 1, rank: position.rank - 2 },
        { file: position.file + 1, rank: position.rank - 2 },
      ],
    },
    {
      leg: { file: position.file + 1, rank: position.rank },
      destinations: [
        { file: position.file + 2, rank: position.rank - 1 },
        { file: position.file + 2, rank: position.rank + 1 },
      ],
    },
    {
      leg: { file: position.file, rank: position.rank + 1 },
      destinations: [
        { file: position.file - 1, rank: position.rank + 2 },
        { file: position.file + 1, rank: position.rank + 2 },
      ],
    },
    {
      leg: { file: position.file - 1, rank: position.rank },
      destinations: [
        { file: position.file - 2, rank: position.rank - 1 },
        { file: position.file - 2, rank: position.rank + 1 },
      ],
    },
  ]
}

export function generateMaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'MA') return []

  return routesFrom(position).flatMap((route) => {
    if (!isInBoard(route.leg) || getPiece(board, route.leg)) return []
    return route.destinations.filter(
      (destination) => isInBoard(destination) && canLand(board, destination, piece.side),
    )
  })
}