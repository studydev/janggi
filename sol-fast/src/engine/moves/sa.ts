import type { Board, Position } from '../types'
import { generatePalacePieceMoves } from './palace'

export function generateSaMoves(board: Board, position: Position): Position[] {
  return generatePalacePieceMoves(board, position, 'SA')
}