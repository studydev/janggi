import { getPiece, isInPalace, toPosition } from '../board'
import type { Board, PieceType, Position } from '../types'
import { canLand, ORTHOGONAL_DIRECTIONS } from './common'

function generatePalaceMoves(
  board: Board,
  position: Position,
  expectedType: PieceType,
): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== expectedType) return []

  const moves = ORTHOGONAL_DIRECTIONS
    .map((direction) => toPosition(
      position.file + direction.file,
      position.rank + direction.rank,
    ))
    .filter((destination): destination is Position => (
      destination !== null
      && isInPalace(destination, piece.side)
      && canLand(board, destination, piece.side)
    ))

  const centerRank = piece.side === 'HAN' ? 2 : 9
  const isCenter = position.file === 5 && position.rank === centerRank
  const isCorner = Math.abs(position.file - 5) === 1
    && Math.abs(position.rank - centerRank) === 1

  if (isCenter) {
    for (const file of [4, 6]) {
      for (const rank of [centerRank - 1, centerRank + 1]) {
        const destination = toPosition(file, rank)
        if (destination && canLand(board, destination, piece.side)) moves.push(destination)
      }
    }
  } else if (isCorner) {
    const destination = toPosition(5, centerRank)
    if (destination && canLand(board, destination, piece.side)) moves.push(destination)
  }

  return moves
}

export function generateGungMoves(board: Board, position: Position): Position[] {
  return generatePalaceMoves(board, position, 'GUNG')
}

export function generateSaMoves(board: Board, position: Position): Position[] {
  return generatePalaceMoves(board, position, 'SA')
}
