/**
 * 차(車).
 * RULES.md: 「가로·세로로 막힐 때까지 직진.
 *            궁성 안 대각선 위에 있으면 그 대각선을 따라 직진 가능.」
 */
import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { raysFrom } from './rays';

export function generateChaMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];

  const out: Position[] = [];
  for (const ray of raysFrom(from)) {
    for (const to of ray) {
      const occupant = pieceAt(board, to);
      if (occupant === null) {
        out.push(to);
        continue;
      }
      if (occupant.side !== piece.side) out.push(to);
      break;
    }
  }
  return out;
}
