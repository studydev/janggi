import { describe, expect, it } from 'vitest';
import { generateMaMoves } from '../moves/ma';
import { at, buildBoard, expectPositions, includesPosition } from './testUtils';

describe('마(馬) 이동', () => {
  it('빈 보드 중앙에서 8곳으로 간다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'MA', file: 5, rank: 5 }]);
    expectPositions(generateMaMoves(board, at(5, 5)), [
      at(4, 3),
      at(6, 3),
      at(4, 7),
      at(6, 7),
      at(3, 4),
      at(3, 6),
      at(7, 4),
      at(7, 6),
    ]);
  });

  it('다리가 막히면 그 방향 두 곳 모두 갈 수 없다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'MA', file: 5, rank: 5 },
      { side: 'HAN', type: 'JOL', file: 5, rank: 4 },
    ]);
    const moves = generateMaMoves(board, at(5, 5));
    expect(includesPosition(moves, at(4, 3))).toBe(false);
    expect(includesPosition(moves, at(6, 3))).toBe(false);
    expect(moves).toHaveLength(6);
  });

  it('아군 위로는 갈 수 없고 적은 잡는다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'MA', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 4, rank: 3 },
      { side: 'HAN', type: 'CHA', file: 6, rank: 3 },
    ]);
    const moves = generateMaMoves(board, at(5, 5));
    expect(includesPosition(moves, at(4, 3))).toBe(false);
    expect(includesPosition(moves, at(6, 3))).toBe(true);
  });

  it('보드 밖으로는 나가지 않는다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'MA', file: 1, rank: 1 }]);
    expectPositions(generateMaMoves(board, at(1, 1)), [at(2, 3), at(3, 2)]);
  });
});
