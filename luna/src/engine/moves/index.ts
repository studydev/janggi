import { getPiece } from '../board'
import type { Board, PieceType, Position } from '../types'
import { generateChaMoves } from './cha'
import { generateJolMoves } from './jol'
import { generateMaMoves } from './ma'
import { generatePalaceMoves } from './palace'
import { generatePoMoves } from './po'
import { generateSangMoves } from './sang'

export { generateChaMoves } from './cha'
export { generateJolMoves } from './jol'
export { generateMaMoves } from './ma'
export { generateGungMoves, generatePalaceMoves, generateSaMoves } from './palace'
export { generatePoMoves } from './po'
export { generateSangMoves } from './sang'

export function generatePieceMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null) return []
  const generators: Record<PieceType, (currentBoard: Board, currentPosition: Position) => Position[]> = {
    GUNG: (currentBoard, currentPosition) => generatePalaceMoves(currentBoard, currentPosition, 'GUNG'),
    SA: (currentBoard, currentPosition) => generatePalaceMoves(currentBoard, currentPosition, 'SA'),
    CHA: generateChaMoves,
    PO: generatePoMoves,
    MA: generateMaMoves,
    SANG: generateSangMoves,
    JOL: generateJolMoves,
  }
  return generators[piece.type](board, position)
}