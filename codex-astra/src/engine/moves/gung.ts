import { isInPalace, palaceRays, pieceAt } from '../board';
import type { Board, Position } from '../types';
import { available, ORTHOGONAL } from './shared';

export function generateGungMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece || !isInPalace(pos, piece.side)) return [];
  const candidates: Position[] = ORTHOGONAL.map(([df, dr]) => ({ file: pos.file + df, rank: pos.rank + dr }));
  for (const ray of palaceRays(pos)) if (ray[0]) candidates.push(ray[0]);
  return candidates.filter(to => isInPalace(to, piece.side) && available(board, pos, to));
}
