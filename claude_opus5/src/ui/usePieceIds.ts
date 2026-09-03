/**
 * 기물에 안정적인 식별자를 붙여 준다.
 *
 * 엔진의 보드는 「어느 칸에 무엇이 있는가」만 담고 기물 개체를 추적하지 않는다.
 * 그런데 CSS transform 트랜지션으로 이동을 보여주려면, 같은 기물이 같은 DOM 노드로
 * 남아 있어야 한다. 그래서 UI 레이어에서만 쓰는 식별자를 여기서 유지한다.
 *
 * 규칙 지식은 전혀 없다 — 「직전 수의 출발/도착」만 힌트로 받는다.
 */
import { useRef } from 'react';
import { BOARD_SIZE, toIndex } from '../engine/board';
import type { Board, Position } from '../engine/types';

export interface MoveHint {
  readonly from: Position;
  readonly to: Position;
}

interface Snapshot {
  readonly key: string;
  readonly ids: (string | null)[];
}

function signature(board: Board): string {
  let s = '';
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = board[i];
    s += sq ? (sq.side === 'HAN' ? 'H' : 'C') + sq.type[0] : '..';
  }
  return s;
}

export function usePieceIds(board: Board, ply: number, lastMove: MoveHint | null): (string | null)[] {
  const ref = useRef<Snapshot | null>(null);
  const counter = useRef(0);
  const key = `${ply}|${signature(board)}`;

  if (ref.current === null || ref.current.key !== key) {
    const ids: (string | null)[] = (ref.current?.ids ?? new Array<string | null>(BOARD_SIZE).fill(null)).slice();

    // 직전 수대로 식별자를 옮긴다 -> 그 기물의 DOM 노드가 유지되어 트랜지션이 걸린다.
    if (lastMove !== null) {
      const from = toIndex(lastMove.from);
      const to = toIndex(lastMove.to);
      if (from >= 0 && from < BOARD_SIZE && to >= 0 && to < BOARD_SIZE) {
        ids[to] = ids[from] ?? null;
        ids[from] = null;
      }
    }

    // 실제 보드와 맞춘다. 새로 생긴 기물(되돌리기·리플레이 점프 등)은 새 식별자를 받는다.
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (board[i]) {
        if (!ids[i]) ids[i] = `pc${counter.current++}`;
      } else {
        ids[i] = null;
      }
    }

    ref.current = { key, ids };
  }

  return ref.current.ids;
}
