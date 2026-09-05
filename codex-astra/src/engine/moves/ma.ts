import type { Board, Position } from '../types';
import { leaperMoves } from './shared';

export function generateMaMoves(board: Board, pos: Position): Position[] {
  return leaperMoves(board, pos, 1);
}
