// 마(馬): 직선 1칸 + 대각 1칸. 첫 직선 칸(다리)이 막히면 이동 불가.
import { isInBoard, pieceAt } from '../board'
import type { Board, Position } from '../types'
import { addPos } from './common'

interface MaOffset {
  readonly leg: Position
  readonly dest: Position
}

const MA_OFFSETS: readonly MaOffset[] = [
  { leg: { file: 0, rank: -1 }, dest: { file: -1, rank: -2 } },
  { leg: { file: 0, rank: -1 }, dest: { file: 1, rank: -2 } },
  { leg: { file: 0, rank: 1 }, dest: { file: -1, rank: 2 } },
  { leg: { file: 0, rank: 1 }, dest: { file: 1, rank: 2 } },
  { leg: { file: -1, rank: 0 }, dest: { file: -2, rank: -1 } },
  { leg: { file: -1, rank: 0 }, dest: { file: -2, rank: 1 } },
  { leg: { file: 1, rank: 0 }, dest: { file: 2, rank: -1 } },
  { leg: { file: 1, rank: 0 }, dest: { file: 2, rank: 1 } },
]

export function generateMaMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  const moves: Position[] = []
  for (const { leg, dest } of MA_OFFSETS) {
    const legPos = addPos(pos, leg)
    if (!isInBoard(legPos) || pieceAt(board, legPos)) continue // 다리 막힘
    const destPos = addPos(pos, dest)
    if (!isInBoard(destPos)) continue
    const target = pieceAt(board, destPos)
    if (target && target.side === piece.side) continue
    moves.push(destPos)
  }
  return moves
}
