/**
 * 의사이동(pseudo-legal move) 통합 진입점.
 *
 * "의사이동" = 기물별 이동 규칙만 적용한 이동. 자기 궁이 장군에 걸리는지는
 * 아직 보지 않는다 (그 필터는 rules.ts 의 generateLegalMoves).
 */

import { fromIndex, pieceAt } from '../board'
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

export interface PseudoMove {
  readonly from: Position
  readonly to: Position
}

export function generatePseudoMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from)
  if (piece === null) return []

  switch (piece.type) {
    case 'CHA':
      return generateChaMoves(board, from)
    case 'PO':
      return generatePoMoves(board, from)
    case 'MA':
      return generateMaMoves(board, from)
    case 'SANG':
      return generateSangMoves(board, from)
    case 'GUNG':
      return generateGungMoves(board, from)
    case 'SA':
      return generateSaMoves(board, from)
    case 'JOL':
      return generateJolMoves(board, from)
  }
}

export function generatePseudoMovesForSide(board: Board, side: Side): PseudoMove[] {
  const moves: PseudoMove[] = []
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece === null || piece.side !== side) continue
    const from = fromIndex(index)
    for (const to of generatePseudoMoves(board, from)) {
      moves.push({ from, to })
    }
  }
  return moves
}
