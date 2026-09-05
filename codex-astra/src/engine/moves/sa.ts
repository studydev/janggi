import type { Board, Position } from '../types';
import { generateGungMoves } from './gung';

export function generateSaMoves(board: Board, pos: Position): Position[] {
  return generateGungMoves(board, pos);
}
