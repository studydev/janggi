// 포(包): 사이에 기물(포대) 정확히 1개를 넘어야 이동/공격 가능. 포는 넘거나 잡을 수 없다.
import { pieceAt } from '../board'
import type { Board, Position } from '../types'
import { getAllRays } from './common'

export function generatePoMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  const moves: Position[] = []
  for (const ray of getAllRays(pos)) {
    let screenFound = false
    for (const point of ray) {
      const occupant = pieceAt(board, point)
      if (!screenFound) {
        if (!occupant) continue // 포대를 찾는 중: 빈 칸은 건너뛴다(착지 불가)
        if (occupant.type === 'PO') break // 포는 포를 넘을 수 없다
        screenFound = true
        continue
      }
      // 포대를 넘은 이후: 착지 후보
      if (!occupant) {
        moves.push(point)
        continue
      }
      if (occupant.type !== 'PO' && occupant.side !== piece.side) moves.push(point) // 포는 포를 잡을 수 없다
      break
    }
  }
  return moves
}
