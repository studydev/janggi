// 차(車): 가로·세로 직진 + 궁성 대각선 직진.
import { pieceAt } from '../board'
import type { Board, Position } from '../types'
import { getAllRays } from './common'

export function generateChaMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  const moves: Position[] = []
  for (const ray of getAllRays(pos)) {
    for (const point of ray) {
      const target = pieceAt(board, point)
      if (!target) {
        moves.push(point)
        continue
      }
      if (target.side !== piece.side) moves.push(point)
      break
    }
  }
  return moves
}
