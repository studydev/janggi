import { getPiece, isOnPalaceDiagonal } from '../board'
import type { Board, Position } from '../types'
import { DIAGONAL_DIRECTIONS, ORTHOGONAL_DIRECTIONS, walkRay } from './shared'

export function generatePoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'PO') return []

  const moves: Position[] = []
  const rays: Array<{ direction: { readonly file: number; readonly rank: number }; palaceDiagonal: boolean }> = ORTHOGONAL_DIRECTIONS.map((direction) => ({ direction, palaceDiagonal: false }))
  if (isOnPalaceDiagonal(position)) {
    rays.push(...DIAGONAL_DIRECTIONS.map((direction) => ({ direction, palaceDiagonal: true })))
  }

  for (const { direction, palaceDiagonal } of rays) {
    let screenFound = false
    for (const destination of walkRay(position, direction, palaceDiagonal)) {
      const target = getPiece(board, destination)
      if (!screenFound) {
        if (target === null) continue
        screenFound = true
        if (target.type === 'PO') break
        continue
      }

      if (target === null) {
        moves.push(destination)
        continue
      }
      if (target.type !== 'PO' && target.side !== piece.side) moves.push(destination)
      break
    }
  }
  return moves
}