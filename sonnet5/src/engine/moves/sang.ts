// 상(象): 직선 1칸 + 대각 2칸. 다리(leg)와 눈(eye) 중 하나라도 막히면 이동 불가.
import { isInBoard, pieceAt } from '../board'
import type { Board, Position } from '../types'
import { addPos } from './common'

interface SangOffset {
  readonly leg: Position
  readonly eye: Position
  readonly dest: Position
}

const SANG_OFFSETS: readonly SangOffset[] = [
  { leg: { file: 0, rank: -1 }, eye: { file: -1, rank: -2 }, dest: { file: -2, rank: -3 } },
  { leg: { file: 0, rank: -1 }, eye: { file: 1, rank: -2 }, dest: { file: 2, rank: -3 } },
  { leg: { file: 0, rank: 1 }, eye: { file: -1, rank: 2 }, dest: { file: -2, rank: 3 } },
  { leg: { file: 0, rank: 1 }, eye: { file: 1, rank: 2 }, dest: { file: 2, rank: 3 } },
  { leg: { file: -1, rank: 0 }, eye: { file: -2, rank: -1 }, dest: { file: -3, rank: -2 } },
  { leg: { file: -1, rank: 0 }, eye: { file: -2, rank: 1 }, dest: { file: -3, rank: 2 } },
  { leg: { file: 1, rank: 0 }, eye: { file: 2, rank: -1 }, dest: { file: 3, rank: -2 } },
  { leg: { file: 1, rank: 0 }, eye: { file: 2, rank: 1 }, dest: { file: 3, rank: 2 } },
]

export function generateSangMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  const moves: Position[] = []
  for (const { leg, eye, dest } of SANG_OFFSETS) {
    const legPos = addPos(pos, leg)
    if (!isInBoard(legPos) || pieceAt(board, legPos)) continue
    const eyePos = addPos(pos, eye)
    if (!isInBoard(eyePos) || pieceAt(board, eyePos)) continue
    const destPos = addPos(pos, dest)
    if (!isInBoard(destPos)) continue
    const target = pieceAt(board, destPos)
    if (target && target.side === piece.side) continue
    moves.push(destPos)
  }
  return moves
}
