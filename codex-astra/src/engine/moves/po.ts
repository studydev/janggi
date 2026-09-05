import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { straightRays } from './shared';

export function generatePoMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];
  const moves: Position[] = [];
  for (const ray of straightRays(pos)) {
    let screened = false;
    for (const to of ray) {
      const target = pieceAt(board, to);
      if (!screened) {
        if (target?.type === 'PO') break;
        if (target) screened = true;
        continue;
      }
      if (!target) moves.push(to);
      else {
        if (target.side !== piece.side && target.type !== 'PO') moves.push(to);
        break;
      }
    }
  }
  return moves;
}
