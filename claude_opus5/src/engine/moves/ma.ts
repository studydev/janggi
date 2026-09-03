/**
 * 마(馬).
 * RULES.md: 「직선 1칸 + 대각 1칸. 첫 직선 칸에 기물이 있으면 막혀서 못 간다(다리 막힘).」
 * 다리 막힘은 아군/적군을 가리지 않는다.
 */
import { isInBoard, pieceAt, shift } from '../board';
import type { Board, Position } from '../types';

/** [다리(직선 1칸) 오프셋, 도착점 오프셋] */
const STEPS: readonly (readonly [readonly [number, number], readonly [number, number]])[] = [
  [
    [0, -1],
    [-1, -2],
  ],
  [
    [0, -1],
    [1, -2],
  ],
  [
    [0, 1],
    [-1, 2],
  ],
  [
    [0, 1],
    [1, 2],
  ],
  [
    [-1, 0],
    [-2, -1],
  ],
  [
    [-1, 0],
    [-2, 1],
  ],
  [
    [1, 0],
    [2, -1],
  ],
  [
    [1, 0],
    [2, 1],
  ],
];

export function generateMaMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];

  const out: Position[] = [];
  for (const [leg, dest] of STEPS) {
    const legPos = shift(from, leg[0], leg[1]);
    if (!isInBoard(legPos)) continue;
    if (pieceAt(board, legPos) !== null) continue; // 다리 막힘

    const to = shift(from, dest[0], dest[1]);
    if (!isInBoard(to)) continue;
    const occupant = pieceAt(board, to);
    if (occupant !== null && occupant.side === piece.side) continue;
    out.push(to);
  }
  return out;
}
