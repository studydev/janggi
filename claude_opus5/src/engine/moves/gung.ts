/**
 * 궁(將)과 사(士). 두 기물의 이동은 완전히 같다.
 * RULES.md: 「궁성 안에서만 선을 따라 1칸. 궁성 대각선 위에서는 대각으로도 1칸.」
 *           「사(士): 궁과 동일. 궁성을 벗어날 수 없다.」
 *
 * 「궁성」은 자기 진영의 궁성을 뜻한다. 상대 궁성으로 넘어갈 수 없다.
 */
import { ORTHOGONAL_DIRS, isInPalace, isOnPalaceDiagonal, palaceDiagonalNeighbors, pieceAt, shift } from '../board';
import type { Board, Position } from '../types';

function generatePalaceStepMoves(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];
  const side = piece.side;

  const candidates: Position[] = [];
  for (const [df, dr] of ORTHOGONAL_DIRS) candidates.push(shift(from, df, dr));
  if (isOnPalaceDiagonal(from)) candidates.push(...palaceDiagonalNeighbors(from));

  const out: Position[] = [];
  for (const to of candidates) {
    if (!isInPalace(to, side)) continue; // 궁성 이탈 금지 (보드 범위도 함께 보장된다)
    const occupant = pieceAt(board, to);
    if (occupant !== null && occupant.side === side) continue;
    out.push(to);
  }
  return out;
}

export function generateGungMoves(board: Board, from: Position): Position[] {
  return generatePalaceStepMoves(board, from);
}

export function generateSaMoves(board: Board, from: Position): Position[] {
  return generatePalaceStepMoves(board, from);
}
