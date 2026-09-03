import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { DIAGONAL_DIRS, ORTHOGONAL_DIRS, orthogonalRay, palaceDiagonalRay } from './helpers';

/**
 * 포(包): 이동·공격 모두 사이에 정확히 기물 1개(포대)를 넘어야 한다.
 * 포는 포를 넘을 수 없고, 포를 잡을 수도 없다.
 */
export function generatePoMoves(board: Board, pos: Position): Position[] {
  const self = pieceAt(board, pos);
  if (!self) return [];

  const moves: Position[] = [];
  const rays = [
    ...ORTHOGONAL_DIRS.map((d) => orthogonalRay(pos, d)),
    ...DIAGONAL_DIRS.map((d) => palaceDiagonalRay(pos, d)),
  ];

  for (const ray of rays) {
    let screenIndex = -1;
    for (let i = 0; i < ray.length; i += 1) {
      const occupant = pieceAt(board, ray[i]);
      if (occupant) {
        screenIndex = occupant.type === 'PO' ? -1 : i; // 포는 포대로 삼을 수 없다
        break;
      }
    }
    if (screenIndex < 0) continue;

    for (let i = screenIndex + 1; i < ray.length; i += 1) {
      const target = ray[i];
      const occupant = pieceAt(board, target);
      if (!occupant) {
        moves.push(target);
        continue;
      }
      if (occupant.type === 'PO') break; // 포는 포를 잡을 수 없다
      if (occupant.side !== self.side) moves.push(target);
      break;
    }
  }
  return moves;
}
