import { isInBoard, pieceAt } from '../board';
import type { Board, Position } from '../types';
import { DIAGONAL_DIRS, ORTHOGONAL_DIRS, canLand, shift } from './helpers';
import type { Delta } from './helpers';

/** 직선 방향 d에 이어지는 두 개의 대각 방향. */
function continuingDiagonals(d: Delta): Delta[] {
  return DIAGONAL_DIRS.filter((dd) => (d.df !== 0 ? dd.df === d.df : dd.dr === d.dr));
}

/** 마(馬): 직선 1칸 + 대각 1칸. 첫 직선 칸이 막히면 갈 수 없다. */
export function generateMaMoves(board: Board, pos: Position): Position[] {
  const self = pieceAt(board, pos);
  if (!self) return [];

  const moves: Position[] = [];
  for (const d of ORTHOGONAL_DIRS) {
    const leg = shift(pos, d);
    if (!isInBoard(leg) || pieceAt(board, leg)) continue; // 다리 막힘
    for (const dd of continuingDiagonals(d)) {
      const target = shift(leg, dd);
      if (canLand(board, target, self.side)) moves.push(target);
    }
  }
  return moves;
}
