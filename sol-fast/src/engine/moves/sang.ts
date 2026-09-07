import { getPiece, toPosition } from '../board'
import type { Board, Position } from '../types'
import { canLand } from './common'

const ELEPHANT_PATHS = [
  { first: [0, -1], second: [-1, -2], end: [-2, -3] },
  { first: [0, -1], second: [1, -2], end: [2, -3] },
  { first: [0, 1], second: [-1, 2], end: [-2, 3] },
  { first: [0, 1], second: [1, 2], end: [2, 3] },
  { first: [-1, 0], second: [-2, -1], end: [-3, -2] },
  { first: [-1, 0], second: [-2, 1], end: [-3, 2] },
  { first: [1, 0], second: [2, -1], end: [3, -2] },
  { first: [1, 0], second: [2, 1], end: [3, 2] },
] as const

export function generateSangMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'SANG') return []

  return ELEPHANT_PATHS.flatMap((path) => {
    const first = toPosition(position.file + path.first[0], position.rank + path.first[1])
    const second = toPosition(position.file + path.second[0], position.rank + path.second[1])
    const destination = toPosition(position.file + path.end[0], position.rank + path.end[1])

    if (!first || !second || !destination) return []
    if (getPiece(board, first) || getPiece(board, second)) return []
    return canLand(board, destination, piece.side) ? [destination] : []
  })
}
