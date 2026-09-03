import { getPiece } from '../board'
import type { Board, Position } from '../types'
import { generateChaMoves } from './cha'
import { generateGungMoves } from './gung'
import { generateJolMoves } from './jol'
import { generateMaMoves } from './ma'
import { generatePoMoves } from './po'
import { generateSaMoves } from './sa'
import { generateSangMoves } from './sang'

export function generatePseudoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (!piece) return []

  switch (piece.type) {
    case 'CHA':
      return generateChaMoves(board, position)
    case 'PO':
      return generatePoMoves(board, position)
    case 'MA':
      return generateMaMoves(board, position)
    case 'SANG':
      return generateSangMoves(board, position)
    case 'GUNG':
      return generateGungMoves(board, position)
    case 'SA':
      return generateSaMoves(board, position)
    case 'JOL':
      return generateJolMoves(board, position)
  }
}
