import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { straightRays } from './shared';

export function generateChaMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];
  const moves: Position[] = [];
  for (const ray of straightRays(pos)) {
    for (const to of ray) {
      const target = pieceAt(board, to);
      if (target?.side !== piece.side) moves.push(to);
      if (target) break;
    }
  }
  return moves;
}
