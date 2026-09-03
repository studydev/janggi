import { isInPalace, isOnPalaceDiagonal, pieceAt } from '../board';
import type { Board, Position } from '../types';
import { DIAGONAL_DIRS, ORTHOGONAL_DIRS, canLand, shift } from './helpers';

/**
 * 궁(將)·사(士): 자기 궁성 안에서만 선을 따라 1칸.
 * 궁성 대각선 위에서는 대각으로도 1칸 움직인다.
 */
export function generatePalaceStepMoves(board: Board, pos: Position): Position[] {
  const self = pieceAt(board, pos);
  if (!self) return [];

  const moves: Position[] = [];
  for (const d of ORTHOGONAL_DIRS) {
    const target = shift(pos, d);
    if (!isInPalace(target, self.side)) continue;
    if (canLand(board, target, self.side)) moves.push(target);
  }

  if (isOnPalaceDiagonal(pos)) {
    for (const d of DIAGONAL_DIRS) {
      const target = shift(pos, d);
      if (!isInPalace(target, self.side) || !isOnPalaceDiagonal(target)) continue;
      if (canLand(board, target, self.side)) moves.push(target);
    }
  }
  return moves;
}

export const generateGungMoves = generatePalaceStepMoves;
export const generateSaMoves = generatePalaceStepMoves;
