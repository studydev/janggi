import {
  getPalaceDiagonalNeighbors,
  getPiece,
  isInPalace,
  isOnPalaceDiagonal,
  palaceSideAt,
} from '../board'
import type { Board, Position } from '../types'
import { generateSlidingMoves, ORTHOGONAL_DIRECTIONS, type Direction } from './shared'

function palaceDirections(position: Position): Direction[] {
  return getPalaceDiagonalNeighbors(position).map((neighbor) => ({
    file: neighbor.file - position.file,
    rank: neighbor.rank - position.rank,
  }))
}

export function generateChaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'CHA') return []

  const moves = generateSlidingMoves(board, position, piece.side, ORTHOGONAL_DIRECTIONS)
  const palaceSide = palaceSideAt(position)
  if (!palaceSide || !isOnPalaceDiagonal(position)) return moves

  return [
    ...moves,
    ...generateSlidingMoves(
      board,
      position,
      piece.side,
      palaceDirections(position),
      (target) => isInPalace(target, palaceSide) && isOnPalaceDiagonal(target),
    ),
  ]
}