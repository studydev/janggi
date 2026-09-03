import { describe, expect, it } from 'vitest';
import { generateGungMoves, generateSaMoves } from '../moves/gung';
import { at, buildBoard, expectPositions, includesPosition } from './testUtils';

describe('궁(將)·사(士) 이동', () => {
  it('궁성 중앙에서는 직선 4곳 + 대각 4곳으로 간다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'GUNG', file: 5, rank: 2 }]);
    expectPositions(generateGungMoves(board, at(5, 2)), [
      at(4, 2),
      at(6, 2),
      at(5, 1),
      at(5, 3),
      at(4, 1),
      at(6, 1),
      at(4, 3),
      at(6, 3),
    ]);
  });

  it('궁성을 벗어나는 수는 만들지 않는다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'SA', file: 4, rank: 1 }]);
    const moves = generateSaMoves(board, at(4, 1));
    expectPositions(moves, [at(5, 1), at(4, 2), at(5, 2)]);
    expect(includesPosition(moves, at(3, 1))).toBe(false);
  });

  it('대각선 위가 아니면 대각으로 못 간다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'GUNG', file: 5, rank: 8 }]);
    expectPositions(generateGungMoves(board, at(5, 8)), [at(4, 8), at(6, 8), at(5, 9)]);
  });

  it('아군이 있는 자리에는 못 가고 적은 잡는다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      { side: 'CHO', type: 'SA', file: 4, rank: 10 },
      { side: 'HAN', type: 'JOL', file: 6, rank: 10 },
    ]);
    const moves = generateGungMoves(board, at(5, 9));
    expect(includesPosition(moves, at(4, 10))).toBe(false);
    expect(includesPosition(moves, at(6, 10))).toBe(true);
  });

  it('상대 궁성으로는 넘어갈 수 없다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'GUNG', file: 5, rank: 3 }]);
    const moves = generateGungMoves(board, at(5, 3));
    expect(includesPosition(moves, at(5, 4))).toBe(false);
  });
});
