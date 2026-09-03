/**
 * 차(車) 의사이동.
 *
 * RULES.md: 가로·세로로 막힐 때까지 직진. 아군을 만나면 정지, 적을 만나면
 * 그 칸까지 포함하고 정지. 궁성 대각선 위에 있으면 그 대각선을 따라서도 직진 가능
 * (궁성 밖으로는 이어지지 않는다).
 */

import { isInBoard, isPalaceDiagonalStep, palaceDiagonalDirs, pieceAt, shift } from '../board'
import type { Board, Position } from '../types'
import { ORTHOGONAL, type Dir } from './common'

export function generateChaMoves(board: Board, from: Position): Position[] {
  const mover = pieceAt(board, from)
  if (mover === null || mover.type !== 'CHA') return []

  const moves: Position[] = []

  const slide = (dir: Dir, palaceDiagonal: boolean): void => {
    let current = from
    for (;;) {
      const next = shift(current, dir.df, dir.dr)
      if (!isInBoard(next)) return
      if (palaceDiagonal && !isPalaceDiagonalStep(current, next)) return

      const target = pieceAt(board, next)
      if (target !== null && target.side === mover.side) return

      moves.push(next)
      if (target !== null) return // 적 기물을 잡고 정지.

      current = next
    }
  }

  for (const dir of ORTHOGONAL) slide(dir, false)
  for (const dir of palaceDiagonalDirs(from)) slide(dir, true)

  return moves
}
