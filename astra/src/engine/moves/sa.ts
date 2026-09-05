import type { Board, Position } from '../types'
import { generatePalaceMoves } from './palace'

export function generateSaMoves(board: Board, position: Position): Position[] {
  return generatePalaceMoves(board, position, 'SA')
}