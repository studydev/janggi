// 차/포가 공유하는 직선 이동 경로 계산 유틸리티.
import { getPalaceDiagonalRays, isInBoard } from '../board'
import type { Position } from '../types'

export const ORTHOGONAL_DIRS: readonly Position[] = [
  { file: 0, rank: -1 },
  { file: 0, rank: 1 },
  { file: -1, rank: 0 },
  { file: 1, rank: 0 },
]

export function addPos(a: Position, b: Position): Position {
  return { file: a.file + b.file, rank: a.rank + b.rank }
}

/** from에서 dir 방향으로 보드를 벗어나기 전까지의 점들을 가까운 순서로 반환. */
export function rayInDirection(from: Position, dir: Position): Position[] {
  const points: Position[] = []
  let cur = addPos(from, dir)
  while (isInBoard(cur)) {
    points.push(cur)
    cur = addPos(cur, dir)
  }
  return points
}

/** 차/포가 사용할 수 있는 모든 직선 경로: 4방향 직교 + (궁성 대각선 위라면) 대각선 경로. */
export function getAllRays(from: Position): Position[][] {
  const rays = ORTHOGONAL_DIRS.map((dir) => rayInDirection(from, dir))
  rays.push(...getPalaceDiagonalRays(from))
  return rays
}
