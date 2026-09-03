import { forwardDir, isInPalace, isOnPalaceDiagonal, opponent, pieceAt } from '../board';
import type { Board, Position } from '../types';
import { DIAGONAL_DIRS, canLand, shift } from './helpers';

/**
 * 졸/병(卒/兵): 앞 또는 좌우로 1칸. 뒤로는 갈 수 없다.
 * 상대 궁성 안의 대각선 위에서는 대각으로 전진할 수 있다.
 */
export function generateJolMoves(board: Board, pos: Position): Position[] {
  const self = pieceAt(board, pos);
  if (!self) return [];

  const forward = forwardDir(self.side);
  const moves: Position[] = [];

  for (const d of [
    { df: 0, dr: forward },
    { df: -1, dr: 0 },
    { df: 1, dr: 0 },
  ]) {
    const target = shift(pos, d);
    if (canLand(board, target, self.side)) moves.push(target);
  }

  const enemyPalace = opponent(self.side);
  if (isInPalace(pos, enemyPalace) && isOnPalaceDiagonal(pos)) {
    for (const d of DIAGONAL_DIRS) {
      if (d.dr !== forward) continue; // 대각 전진만 허용
      const target = shift(pos, d);
      if (!isInPalace(target, enemyPalace) || !isOnPalaceDiagonal(target)) continue;
      if (canLand(board, target, self.side)) moves.push(target);
    }
  }
  return moves;
}
