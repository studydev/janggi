import { getPiece, toPosition } from '../board'
import type { Board, Position } from '../types'
import { canLand } from './common'

const HORSE_PATHS = [
  { leg: [0, -1], destinations: [[-1, -2], [1, -2]] },
  { leg: [0, 1], destinations: [[-1, 2], [1, 2]] },
  { leg: [-1, 0], destinations: [[-2, -1], [-2, 1]] },
  { leg: [1, 0], destinations: [[2, -1], [2, 1]] },
] as const

export function generateMaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'MA') return []

  return HORSE_PATHS.flatMap((path) => {
    const leg = toPosition(position.file + path.leg[0], position.rank + path.leg[1])
    if (!leg || getPiece(board, leg)) return []

    return path.destinations
      .map(([fileDelta, rankDelta]) => toPosition(
        position.file + fileDelta,
        position.rank + rankDelta,
      ))
      .filter((destination): destination is Position => (
        destination !== null && canLand(board, destination, piece.side)
      ))
  })
}
