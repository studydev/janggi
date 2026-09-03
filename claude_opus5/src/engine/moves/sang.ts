/**
 * 상(象).
 * RULES.md: 「직선 1칸 + 대각 2칸. 경로상 중간 두 지점 중 하나라도 막히면 못 간다.」
 *
 * 샹치의 상(2칸 대각)과 다르다. 강(河)이 없으므로 진영 제한도 없다.
 */
import { isInBoard, pieceAt, shift } from '../board';
import type { Board, Position } from '../types';

type Offset = readonly [number, number];

/** [중간지점1(직선 1칸), 중간지점2(대각 1칸), 도착점(대각 2칸)] */
const STEPS: readonly (readonly [Offset, Offset, Offset])[] = [
  [
    [0, -1],
    [-1, -2],
    [-2, -3],
  ],
  [
    [0, -1],
    [1, -2],
    [2, -3],
  ],
  [
    [0, 1],
    [-1, 2],
    [-2, 3],
  ],
  [
    [0, 1],
    [1, 2],
    [2, 3],
  ],
  [
    [-1, 0],
    [-2, -1],
    [-3, -2],
  ],
  [
    [-1, 0],
    [-2, 1],
    [-3, 2],
  ],
  [
    [1, 0],
    [2, -1],
    [3, -2],
  ],
  [
    [1, 0],
    [2, 1],
    [3, 2],
  ],
];

export function generateSangMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];

  const out: Position[] = [];
  for (const [via1, via2, dest] of STEPS) {
    const p1 = shift(from, via1[0], via1[1]);
    if (!isInBoard(p1) || pieceAt(board, p1) !== null) continue;

    const p2 = shift(from, via2[0], via2[1]);
    if (!isInBoard(p2) || pieceAt(board, p2) !== null) continue;

    const to = shift(from, dest[0], dest[1]);
    if (!isInBoard(to)) continue;
    const occupant = pieceAt(board, to);
    if (occupant !== null && occupant.side === piece.side) continue;
    out.push(to);
  }
  return out;
}
