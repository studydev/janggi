import {
  getPalaceDiagonalNeighbors,
  getPiece,
  isInBoard,
  isInPalace,
  isOnPalaceDiagonal,
  palaceSideAt,
} from '../board'
import type { Board, Position, Side } from '../types'
import { ORTHOGONAL_DIRECTIONS, type Direction } from './shared'

function palaceDirections(position: Position): Direction[] {
  return getPalaceDiagonalNeighbors(position).map((neighbor) => ({
    file: neighbor.file - position.file,
    rank: neighbor.rank - position.rank,
  }))
}

function generatePoRays(
  board: Board,
  from: Position,
  side: Side,
  directions: readonly Direction[],
  isValidTarget: (position: Position) => boolean = isInBoard,
): Position[] {
  const moves: Position[] = []

  for (const direction of directions) {
    let foundScreen = false
    let target = {
      file: from.file + direction.file,
      rank: from.rank + direction.rank,
    }

    while (isInBoard(target) && isValidTarget(target)) {
      const occupant = getPiece(board, target)
      if (!foundScreen) {
        if (occupant) {
          if (occupant.type === 'PO') break
          foundScreen = true
        }
      } else if (!occupant) {
        moves.push(target)
      } else {
        if (occupant.side !== side && occupant.type !== 'PO') moves.push(target)
        break
      }

      target = {
        file: target.file + direction.file,
        rank: target.rank + direction.rank,
      }
    }
  }

  return moves
}

export function generatePoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece || piece.type !== 'PO') return []

  const moves = generatePoRays(board, position, piece.side, ORTHOGONAL_DIRECTIONS)
  const palaceSide = palaceSideAt(position)
  if (!palaceSide || !isOnPalaceDiagonal(position)) return moves

  return [
    ...moves,
    ...generatePoRays(
      board,
      position,
      piece.side,
      palaceDirections(position),
      (target) => isInPalace(target, palaceSide) && isOnPalaceDiagonal(target),
    ),
  ]
}