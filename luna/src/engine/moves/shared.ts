import { getPiece, isInBoard, isPalaceDiagonalStep } from '../board'
import type { Board, Piece, Position } from '../types'

export const ORTHOGONAL_DIRECTIONS = [
  { file: 1, rank: 0 },
  { file: -1, rank: 0 },
  { file: 0, rank: 1 },
  { file: 0, rank: -1 },
] as const

export const DIAGONAL_DIRECTIONS = [
  { file: 1, rank: 1 },
  { file: 1, rank: -1 },
  { file: -1, rank: 1 },
  { file: -1, rank: -1 },
] as const

export function offsetPosition(position: Position, file: number, rank: number): Position {
  return { file: position.file + file, rank: position.rank + rank }
}

export function canLand(board: Board, position: Position, movingPiece: Piece): boolean {
  if (!isInBoard(position)) return false
  const target = getPiece(board, position)
  return target === null || target.side !== movingPiece.side
}

export function walkRay(
  origin: Position,
  direction: { readonly file: number; readonly rank: number },
  palaceDiagonal: boolean,
): Position[] {
  const positions: Position[] = []
  let current = origin
  while (true) {
    const next = offsetPosition(current, direction.file, direction.rank)
    if (!isInBoard(next)) break
    if (palaceDiagonal && !isPalaceDiagonalStep(current, next)) break
    positions.push(next)
    current = next
  }
  return positions
}

export function addUniquePosition(positions: Position[], candidate: Position): void {
  if (!positions.some((position) => position.file === candidate.file && position.rank === candidate.rank)) {
    positions.push(candidate)
  }
}