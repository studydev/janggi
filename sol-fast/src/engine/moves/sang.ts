import { getPiece, isInBoard } from '../board'
import type { Board, Position } from '../types'
import { canLand, ORTHOGONAL_DIRECTIONS, type Direction } from './shared'

interface SangRoute {
  readonly first: Position
  readonly second: Position
  readonly destination: Position
}

function diagonalBranches(straight: Direction): readonly Direction[] {
  if (straight.file === 0) {
    return [
      { file: -1, rank: straight.rank },
      { file: 1, rank: straight.rank },
    ]
  }
  return [
    { file: straight.file, rank: -1 },
    { file: straight.file, rank: 1 },
  ]
}

function routesFrom(position: Position): SangRoute[] {
  return ORTHOGONAL_DIRECTIONS.flatMap((straight) => {
    const first = {
      file: position.file + straight.file,
      rank: position.rank + straight.rank,
    }
    return diagonalBranches(straight).map((diagonal) => {
      const second = {
        file: first.file + diagonal.file,
        rank: first.rank + diagonal.rank,
      }
      return {
        first,
        second,
        destination: {
          file: second.file + diagonal.file,
          rank: second.rank + diagonal.rank,
        },
      }
    })
  })
}

export function generateSangMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'SANG') return []

  return routesFrom(position)
    .filter(
      (route) =>
        isInBoard(route.first) &&
        isInBoard(route.second) &&
        !getPiece(board, route.first) &&
        !getPiece(board, route.second) &&
        isInBoard(route.destination) &&
        canLand(board, route.destination, piece.side),
    )
    .map((route) => route.destination)
}