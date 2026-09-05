import type { Board, Position } from '../types'
import { generatePalaceMoves } from './palace'

export function generateGungMoves(board: Board, position: Position): Position[] {
  return generatePalaceMoves(board, position, 'GUNG')
}