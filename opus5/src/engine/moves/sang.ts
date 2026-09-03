import { isInBoard, pieceAt } from '../board';
import type { Board, Position } from '../types';
import { DIAGONAL_DIRS, ORTHOGONAL_DIRS, canLand, shift } from './helpers';
import type { Delta } from './helpers';

function continuingDiagonals(d: Delta): Delta[] {
  return DIAGONAL_DIRS.filter((dd) => (d.df !== 0 ? dd.df === d.df : dd.dr === d.dr));
}

/** 상(象): 직선 1칸 + 대각 2칸. 중간 두 지점 중 하나라도 막히면 갈 수 없다. */
export function generateSangMoves(board: Board, pos: Position): Position[] {
  const self = pieceAt(board, pos);
  if (!self) return [];

  const moves: Position[] = [];
  for (const d of ORTHOGONAL_DIRS) {
    const leg1 = shift(pos, d);
    if (!isInBoard(leg1) || pieceAt(board, leg1)) continue;
    for (const dd of continuingDiagonals(d)) {
      const leg2 = shift(leg1, dd);
      if (!isInBoard(leg2) || pieceAt(board, leg2)) continue;
      const target = shift(leg2, dd);
      if (canLand(board, target, self.side)) moves.push(target);
    }
  }
  return moves;
}
