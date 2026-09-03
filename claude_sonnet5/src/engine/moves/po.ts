/**
 * 포(包) 의사이동.
 *
 * RULES.md: 이동과 공격 모두, 사이에 **정확히 기물 1개(포대)** 를 넘어야 한다.
 *  - 포대가 0개거나 2개 이상이면 그 방향으로 갈 수 없다.
 *  - 포는 다른 포를 넘을 수 없다. 포는 다른 포를 잡을 수 없다.
 *  - 궁성 대각선에서도 같은 조건(궁성 중앙에 포대가 있으면)으로 이동 가능.
 *
 * 이 함수는 이동·공격을 구분하지 않는다 (규칙이 동일). rules.ts 의 공격 판정도
 * 이 함수를 그대로 재사용해 규칙이 갈라지지 않게 한다.
 */

import { isInBoard, isPalaceDiagonalStep, palaceDiagonalDirs, pieceAt, shift } from '../board'
import type { Board, Position } from '../types'
import { ORTHOGONAL, type Dir } from './common'

export function generatePoMoves(board: Board, from: Position): Position[] {
  const mover = pieceAt(board, from)
  if (mover === null || mover.type !== 'PO') return []

  const moves: Position[] = []

  const walk = (dir: Dir, palaceDiagonal: boolean): void => {
    let current = from
    let jumped = false // 포대를 넘었는가

    for (;;) {
      const next = shift(current, dir.df, dir.dr)
      if (!isInBoard(next)) return
      if (palaceDiagonal && !isPalaceDiagonalStep(current, next)) return

      const target = pieceAt(board, next)

      if (!jumped) {
        // 아직 포대를 찾는 중.
        if (target === null) {
          current = next
          continue
        }
        if (target.type === 'PO') return // 포는 포를 넘을 수 없다.
        jumped = true
        current = next
        continue
      }

      // 포대를 이미 넘음 — 착지 지점을 찾는다.
      if (target === null) {
        moves.push(next)
        current = next
        continue
      }
      if (target.type === 'PO') return // 포는 포를 잡을 수 없다.
      if (target.side !== mover.side) moves.push(next) // 적 기물 포획.
      return // 어느 경우든 여기서 정지.
    }
  }

  for (const dir of ORTHOGONAL) walk(dir, false)
  for (const dir of palaceDiagonalDirs(from)) walk(dir, true)

  return moves
}
