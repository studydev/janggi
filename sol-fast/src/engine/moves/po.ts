import { getPiece } from '../board'
import type { Board, Position } from '../types'
import {
  getOrthogonalRay,
  getPalaceDiagonalRays,
  ORTHOGONAL_DIRECTIONS,
} from './common'

function collectCannonMoves(board: Board, position: Position, ray: ReadonlyArray<Position>): Position[] {
  const cannon = getPiece(board, position)
  if (!cannon || cannon.type !== 'PO') return []

  const moves: Position[] = []
  let hasScreen = false

  for (const destination of ray) {
    const target = getPiece(board, destination)

    if (!hasScreen) {
      if (!target) continue
      if (target.type === 'PO') break
      hasScreen = true
      continue
    }

    if (!target) {
      moves.push(destination)
      continue
    }

    if (target.type !== 'PO' && target.side !== cannon.side) {
      moves.push(destination)
    }
    break
  }

  return moves
}

export function generatePoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'PO') return []

  const rays = ORTHOGONAL_DIRECTIONS.map((direction) => getOrthogonalRay(
    position,
    direction.file,
    direction.rank,
  ))

  return [...rays, ...getPalaceDiagonalRays(position)]
    .flatMap((ray) => collectCannonMoves(board, position, ray))
}
