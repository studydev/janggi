import { getPiece } from '../board'
import type { Board, Position } from '../types'
import { canLand, ORTHOGONAL_DIRECTIONS } from './shared'

export function generateSangMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece?.type !== 'SANG') return []
  const moves: Position[] = []
  for (const direction of ORTHOGONAL_DIRECTIONS) {
    const first = { file: position.file + direction.file, rank: position.rank + direction.rank }
    if (getPiece(board, first)) continue
    for (const sign of [-1, 1]) {
      const second = {
        file: position.file + direction.file * 2 + direction.rank * sign,
        rank: position.rank + direction.rank * 2 + direction.file * sign,
      }
      if (getPiece(board, second)) continue
      const target = {
        file: position.file + direction.file * 3 + direction.rank * sign * 2,
        rank: position.rank + direction.rank * 3 + direction.file * sign * 2,
      }
      if (canLand(board, target, piece.side)) moves.push(target)
    }
  }
  return moves
}