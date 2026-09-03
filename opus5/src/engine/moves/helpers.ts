import { isInBoard, isOnPalaceDiagonal, pieceAt } from '../board';
import type { Board, Position, Side } from '../types';

export interface Delta {
  readonly df: number;
  readonly dr: number;
}

export const ORTHOGONAL_DIRS: readonly Delta[] = [
  { df: 0, dr: -1 },
  { df: 0, dr: 1 },
  { df: -1, dr: 0 },
  { df: 1, dr: 0 },
];

export const DIAGONAL_DIRS: readonly Delta[] = [
  { df: -1, dr: -1 },
  { df: 1, dr: -1 },
  { df: -1, dr: 1 },
  { df: 1, dr: 1 },
];

export function shift(pos: Position, d: Delta, times = 1): Position {
  return { file: pos.file + d.df * times, rank: pos.rank + d.dr * times };
}

/** 빈 칸이거나 적 기물이면 착지 가능. */
export function canLand(board: Board, pos: Position, side: Side): boolean {
  if (!isInBoard(pos)) return false;
  const target = pieceAt(board, pos);
  return target === null || target.side !== side;
}

/**
 * 궁성 대각선을 따라가는 경로. 시작점이 대각선 위가 아니면 빈 배열.
 * 대각선은 궁성 밖으로 이어지지 않으므로 대각선 교차점이 끊기면 경로도 끝난다.
 */
export function palaceDiagonalRay(from: Position, d: Delta): Position[] {
  if (!isOnPalaceDiagonal(from)) return [];
  const path: Position[] = [];
  let current = shift(from, d);
  while (isOnPalaceDiagonal(current)) {
    path.push(current);
    current = shift(current, d);
  }
  return path;
}

/** 직교 방향으로 보드 끝까지 이어지는 경로. */
export function orthogonalRay(from: Position, d: Delta): Position[] {
  const path: Position[] = [];
  let current = shift(from, d);
  while (isInBoard(current)) {
    path.push(current);
    current = shift(current, d);
  }
  return path;
}
