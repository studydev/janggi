import { isInBoard, palaceRays, pieceAt } from '../board';
import type { Board, Position } from '../types';

export const ORTHOGONAL = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

export function available(board: Board, from: Position, to: Position): boolean {
  const piece = pieceAt(board, from);
  return !!piece && isInBoard(to) && pieceAt(board, to)?.side !== piece.side;
}

export function straightRays(pos: Position): Position[][] {
  const rays: Position[][] = [];
  for (const [df, dr] of ORTHOGONAL) {
    const ray: Position[] = [];
    for (let step = 1; step <= 9; step++) {
      const point = { file: pos.file + df * step, rank: pos.rank + dr * step };
      if (!isInBoard(point)) break;
      ray.push(point);
    }
    rays.push(ray);
  }
  return [...rays, ...palaceRays(pos)];
}

export function leaperMoves(board: Board, pos: Position, diagonalSteps: 1 | 2): Position[] {
  if (!pieceAt(board, pos)) return [];
  const moves: Position[] = [];
  for (const [df, dr] of ORTHOGONAL) {
    const first = { file: pos.file + df, rank: pos.rank + dr };
    if (!isInBoard(first) || pieceAt(board, first)) continue;
    for (const sign of [-1, 1]) {
      const diagonalFile = df === 0 ? sign : df;
      const diagonalRank = dr === 0 ? sign : dr;
      const second = { file: first.file + diagonalFile, rank: first.rank + diagonalRank };
      if (diagonalSteps === 2 && (!isInBoard(second) || pieceAt(board, second))) continue;
      const to = { file: first.file + diagonalFile * diagonalSteps, rank: first.rank + diagonalRank * diagonalSteps };
      if (available(board, pos, to)) moves.push(to);
    }
  }
  return moves;
}
