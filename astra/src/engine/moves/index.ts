import { getPiece } from '../board'
import type { Board, PieceType, Position } from '../types'
import { generateChaMoves } from './cha'
import { generateGungMoves } from './gung'
import { generateJolMoves } from './jol'
import { generateMaMoves } from './ma'
import { generatePoMoves } from './po'
import { generateSaMoves } from './sa'
import { generateSangMoves } from './sang'

const generators: Record<PieceType, (board: Board, position: Position) => Position[]> = {
  CHA: generateChaMoves, PO: generatePoMoves, MA: generateMaMoves, SANG: generateSangMoves,
  GUNG: generateGungMoves, SA: generateSaMoves, JOL: generateJolMoves,
}

export function generatePseudoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  return piece ? generators[piece.type](board, position) : []
}