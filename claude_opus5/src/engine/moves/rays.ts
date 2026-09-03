/**
 * 차(車)와 포(包)가 공유하는 「직진 경로」 생성기.
 *
 * 두 기물의 진행 경로는 완전히 같고, 경로 위에서 무엇을 하느냐만 다르다.
 * 경로를 한 곳에서 만들어야 궁성 대각선 규칙이 두 기물 사이에서 갈라지지 않는다.
 */
import {
  DIAGONAL_DIRS,
  ORTHOGONAL_DIRS,
  isInBoard,
  isOnPalaceDiagonal,
  nextOnPalaceDiagonal,
  shift,
} from '../board';
import type { Position } from '../types';

/** 보드 끝까지 이어지는 가로/세로 경로. */
export function orthogonalRay(from: Position, df: number, dr: number): Position[] {
  const out: Position[] = [];
  let cur = shift(from, df, dr);
  while (isInBoard(cur)) {
    out.push(cur);
    cur = shift(cur, df, dr);
  }
  return out;
}

/**
 * 궁성 대각선을 따라가는 경로. 그어진 선이 끊기면 거기서 끝난다.
 * 귀퉁이 -> 중앙 -> 반대편 귀퉁이 (최대 2칸), 중앙 -> 귀퉁이 (1칸).
 */
export function palaceDiagonalRay(from: Position, df: number, dr: number): Position[] {
  const out: Position[] = [];
  let cur = nextOnPalaceDiagonal(from, df, dr);
  while (cur !== null) {
    out.push(cur);
    cur = nextOnPalaceDiagonal(cur, df, dr);
  }
  return out;
}

/** 해당 지점에서 뻗어 나가는 모든 경로(가로·세로 + 궁성 대각선). */
export function raysFrom(from: Position): Position[][] {
  const rays: Position[][] = [];
  for (const [df, dr] of ORTHOGONAL_DIRS) {
    const ray = orthogonalRay(from, df, dr);
    if (ray.length > 0) rays.push(ray);
  }
  if (isOnPalaceDiagonal(from)) {
    for (const [df, dr] of DIAGONAL_DIRS) {
      const ray = palaceDiagonalRay(from, df, dr);
      if (ray.length > 0) rays.push(ray);
    }
  }
  return rays;
}
