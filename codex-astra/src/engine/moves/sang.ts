import type { Board, Position } from '../types';
import { leaperMoves } from './shared';

export function generateSangMoves(board: Board, pos: Position): Position[] {
  return leaperMoves(board, pos, 2);
}
