import type { Board, Position } from '../types'
import { generatePalacePieceMoves } from './palace'

export function generateGungMoves(board: Board, position: Position): Position[] {
  return generatePalacePieceMoves(board, position, 'GUNG')
}
