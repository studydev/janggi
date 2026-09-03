/**
 * 졸(卒) / 병(兵).
 * RULES.md: 「앞 또는 좌우로 1칸. 뒤로 갈 수 없다.
 *            상대 궁성 안의 대각선 위에서는 대각으로 전진할 수 있다.」
 *
 * 샹치와 달리 처음부터 좌우로 이동할 수 있다(강이 없다).
 */
import {
  forwardDir,
  isInBoard,
  isOnPalaceDiagonalOf,
  palaceDiagonalNeighbors,
  pieceAt,
  shift,
} from '../board';
import { opponent, type Board, type Position } from '../types';

export function generateJolMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];

  const side = piece.side;
  const fwd = forwardDir(side);

  const candidates: Position[] = [
    shift(from, 0, fwd), // 전진
    shift(from, -1, 0), // 좌
    shift(from, 1, 0), // 우
  ];

  // 상대 궁성 대각선 위라면, 그어진 대각선 중 「전진」 방향만 추가한다.
  if (isOnPalaceDiagonalOf(from, opponent(side))) {
    for (const n of palaceDiagonalNeighbors(from)) {
      if (n.rank - from.rank === fwd) candidates.push(n);
    }
  }

  const out: Position[] = [];
  for (const to of candidates) {
    if (!isInBoard(to)) continue;
    const occupant = pieceAt(board, to);
    if (occupant !== null && occupant.side === side) continue;
    out.push(to);
  }
  return out;
}
