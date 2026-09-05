import { getPiece } from '../board'
import type { Board, Position } from '../types'
import { raysFrom } from './shared'

export function generatePoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece?.type !== 'PO') return []
  const moves: Position[] = []
  for (const ray of raysFrom(position)) {
    let foundScreen = false
    for (const target of ray) {
      const occupant = getPiece(board, target)
      if (!foundScreen) {
        if (occupant?.type === 'PO') break
        if (occupant) foundScreen = true
      } else if (!occupant) {
        moves.push(target)
      } else {
        if (occupant.side !== piece.side && occupant.type !== 'PO') moves.push(target)
        break
      }
    }
  }
  return moves
}