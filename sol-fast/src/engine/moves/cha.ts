import { getPiece } from '../board'
import type { Board, Position } from '../types'
import {
  collectSlidingMoves,
  getOrthogonalRay,
  getPalaceDiagonalRays,
  ORTHOGONAL_DIRECTIONS,
} from './common'

export function generateChaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'CHA') return []

  const rays = ORTHOGONAL_DIRECTIONS.map((direction) => getOrthogonalRay(
    position,
    direction.file,
    direction.rank,
  ))

  return [...rays, ...getPalaceDiagonalRays(position)]
    .flatMap((ray) => collectSlidingMoves(board, piece.side, ray))
}
