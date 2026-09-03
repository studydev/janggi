import { getPiece, isInBoard, shiftPosition } from '../board'
import type { Board, Position } from '../types'

interface MaPattern {
  leg: Position
  destinations: readonly Position[]
}

const patterns: readonly MaPattern[] = [
  { leg: { file: 0, rank: -1 }, destinations: [{ file: -1, rank: -2 }, { file: 1, rank: -2 }] },
  { leg: { file: 0, rank: 1 }, destinations: [{ file: -1, rank: 2 }, { file: 1, rank: 2 }] },
  { leg: { file: -1, rank: 0 }, destinations: [{ file: -2, rank: -1 }, { file: -2, rank: 1 }] },
  { leg: { file: 1, rank: 0 }, destinations: [{ file: 2, rank: -1 }, { file: 2, rank: 1 }] },
]

export function generateMaMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null || piece.type !== 'MA') {
    return []
  }

  const moves: Position[] = []
  for (const pattern of patterns) {
    const leg = shiftPosition(position, pattern.leg.file, pattern.leg.rank)
    if (!isInBoard(leg) || getPiece(board, leg) !== null) {
      continue
    }

    for (const destination of pattern.destinations) {
      const target = shiftPosition(position, destination.file, destination.rank)
      if (!isInBoard(target)) {
        continue
      }

      const occupyingPiece = getPiece(board, target)
      if (occupyingPiece?.side !== piece.side) {
        moves.push(target)
      }
    }
  }

  return moves
}