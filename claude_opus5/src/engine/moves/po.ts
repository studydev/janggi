/**
 * 포(包).
 * RULES.md: 「이동과 공격 모두, 사이에 정확히 기물 1개(포대)를 넘어야 한다.
 *            포대가 0개거나 2개 이상이면 그 방향으로 갈 수 없다.
 *            포는 다른 포를 넘을 수 없다. 포는 다른 포를 잡을 수 없다.
 *            궁성 대각선에서도 같은 조건으로 이동 가능.」
 *
 * 주의: 이동과 공격을 나눠 구현하면 안 된다. 하나의 규칙이다.
 */
import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { raysFrom } from './rays';

export function generatePoMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];

  const out: Position[] = [];
  for (const ray of raysFrom(from)) {
    // 1) 경로에서 첫 기물(포대)을 찾는다.
    let i = 0;
    while (i < ray.length && pieceAt(board, ray[i]!) === null) i++;
    if (i >= ray.length) continue; // 포대가 없다 -> 이 방향은 불가

    const screen = pieceAt(board, ray[i]!)!;
    if (screen.type === 'PO') continue; // 포는 포를 넘을 수 없다

    // 2) 포대 바로 다음 지점부터가 착지 가능 구간.
    for (i += 1; i < ray.length; i++) {
      const to = ray[i]!;
      const occupant = pieceAt(board, to);
      if (occupant === null) {
        out.push(to);
        continue;
      }
      // 포는 포를 잡을 수 없다. 그 자리에서 막히기도 한다(두 번째 포대가 되지 않는다).
      if (occupant.type !== 'PO' && occupant.side !== piece.side) out.push(to);
      break;
    }
  }
  return out;
}
