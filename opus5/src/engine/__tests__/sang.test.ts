import { describe, expect, it } from 'vitest';
import { generateSangMoves } from '../moves/sang';
import { at, buildBoard, expectPositions, includesPosition } from './testUtils';

describe('상(象) 이동', () => {
  it('빈 보드 중앙에서 8곳으로 간다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'SANG', file: 5, rank: 5 }]);
    expectPositions(generateSangMoves(board, at(5, 5)), [
      at(3, 2),
      at(7, 2),
      at(3, 8),
      at(7, 8),
      at(2, 3),
      at(2, 7),
      at(8, 3),
      at(8, 7),
    ]);
  });

  it('첫 직선 칸이 막히면 그 방향 두 곳 모두 막힌다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'SANG', file: 5, rank: 5 },
      { side: 'HAN', type: 'JOL', file: 5, rank: 4 },
    ]);
    const moves = generateSangMoves(board, at(5, 5));
    expect(includesPosition(moves, at(3, 2))).toBe(false);
    expect(includesPosition(moves, at(7, 2))).toBe(false);
    expect(moves).toHaveLength(6);
  });

  it('두 번째 대각 지점이 막히면 그 한 곳만 막힌다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'SANG', file: 5, rank: 5 },
      { side: 'HAN', type: 'JOL', file: 4, rank: 3 },
    ]);
    const moves = generateSangMoves(board, at(5, 5));
    expect(includesPosition(moves, at(3, 2))).toBe(false);
    expect(includesPosition(moves, at(7, 2))).toBe(true);
    expect(moves).toHaveLength(7);
  });

  it('도착 지점이 적이면 잡고 아군이면 못 간다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'SANG', file: 5, rank: 5 },
      { side: 'HAN', type: 'CHA', file: 3, rank: 2 },
      { side: 'CHO', type: 'CHA', file: 7, rank: 2 },
    ]);
    const moves = generateSangMoves(board, at(5, 5));
    expect(includesPosition(moves, at(3, 2))).toBe(true);
    expect(includesPosition(moves, at(7, 2))).toBe(false);
  });
});
