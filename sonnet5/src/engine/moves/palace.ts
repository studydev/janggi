// 궁(將)/사(士): 궁성 안에서만 1칸 이동. 궁성 대각선 위에서는 대각으로도 1칸.
import { getPalaceDiagonalRays, isInPalace, pieceAt } from '../board'
import type { Board, Position } from '../types'
import { addPos, ORTHOGONAL_DIRS } from './common'

function generatePalaceStepMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  const moves: Position[] = []
  for (const dir of ORTHOGONAL_DIRS) {
    const dest = addPos(pos, dir)
    if (!isInPalace(dest, piece.side)) continue
    const target = pieceAt(board, dest)
    if (target && target.side === piece.side) continue
    moves.push(dest)
  }
  for (const ray of getPalaceDiagonalRays(pos)) {
    const dest = ray[0]
    if (!dest || !isInPalace(dest, piece.side)) continue
    const target = pieceAt(board, dest)
    if (target && target.side === piece.side) continue
    moves.push(dest)
  }
  return moves
}

export function generateGungMoves(board: Board, pos: Position): Position[] {
  return generatePalaceStepMoves(board, pos)
}

export function generateSaMoves(board: Board, pos: Position): Position[] {
  return generatePalaceStepMoves(board, pos)
}
