import { forwardDir, isInPalace, otherSide, palaceRays, pieceAt } from '../board';
import type { Board, Position } from '../types';
import { available } from './shared';

export function generateJolMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];
  const forward = forwardDir(piece.side);
  const candidates = [
    { file: pos.file - 1, rank: pos.rank },
    { file: pos.file + 1, rank: pos.rank },
    { file: pos.file, rank: pos.rank + forward },
  ];
  if (isInPalace(pos, otherSide(piece.side))) {
    for (const ray of palaceRays(pos)) {
      const to = ray[0];
      if (to && to.rank - pos.rank === forward) candidates.push(to);
    }
  }
  return candidates.filter(to => available(board, pos, to));
}
