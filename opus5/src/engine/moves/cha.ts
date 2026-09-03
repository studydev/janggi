import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { DIAGONAL_DIRS, ORTHOGONAL_DIRS, orthogonalRay, palaceDiagonalRay } from './helpers';

/**
 * 차(車): 가로·세로로 막힐 때까지 직진.
 * 궁성 대각선 위에 있으면 그 대각선을 따라서도 직진할 수 있다.
 */
export function generateChaMoves(board: Board, pos: Position): Position[] {
  const self = pieceAt(board, pos);
  if (!self) return [];

  const moves: Position[] = [];
  const rays = [
    ...ORTHOGONAL_DIRS.map((d) => orthogonalRay(pos, d)),
    ...DIAGONAL_DIRS.map((d) => palaceDiagonalRay(pos, d)),
  ];

  for (const ray of rays) {
    for (const target of ray) {
      const occupant = pieceAt(board, target);
      if (!occupant) {
        moves.push(target);
        continue;
      }
      if (occupant.side !== self.side) moves.push(target);
      break;
    }
  }
  return moves;
}
