import { fromIndex, getPiece } from '../board'
import type { Board, Position, Side } from '../types'
import { generateChaMoves } from './cha'
import { generateGungMoves, generateSaMoves } from './gung'
import { generateJolMoves } from './jol'
import { generateMaMoves } from './ma'
import { generatePoMoves } from './po'
import { generateSangMoves } from './sang'

export { generateChaMoves } from './cha'
export { generateGungMoves, generateSaMoves } from './gung'
export { generateJolMoves } from './jol'
export { generateMaMoves } from './ma'
export { generatePoMoves } from './po'
export { generateSangMoves } from './sang'

export function generatePseudoMoves(board: Board, position: Position): Position[] {
  const piece = getPiece(board, position)
  if (piece === null) {
    return []
  }

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

export function generatePseudoMovesForSide(board: Board, side: Side): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = []
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece?.side !== side) {
      continue
    }

    const from = fromIndex(index)
    for (const to of generatePseudoMoves(board, from)) {
      moves.push({ from, to })
    }
  }
  return moves
}
