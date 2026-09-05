import { getPiece } from '../board'
import type { Board, Position } from '../types'
import { canLand, ORTHOGONAL_DIRECTIONS } from './shared'

export function generateMaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece?.type !== 'MA') return []
  const moves: Position[] = []
  for (const direction of ORTHOGONAL_DIRECTIONS) {
    const leg = { file: position.file + direction.file, rank: position.rank + direction.rank }
    if (getPiece(board, leg)) continue
    for (const sign of [-1, 1]) {
      const target = {
        file: position.file + direction.file * 2 + direction.rank * sign,
        rank: position.rank + direction.rank * 2 + direction.file * sign,
      }
      if (canLand(board, target, piece.side)) moves.push(target)
    }
  }
  return moves
}