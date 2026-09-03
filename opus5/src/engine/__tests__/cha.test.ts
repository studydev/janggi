import { describe, expect, it } from 'vitest';
import { generateChaMoves } from '../moves/cha';
import { at, buildBoard, expectPositions, includesPosition } from './testUtils';

describe('차(車) 이동', () => {
  it('빈 보드 중앙에서는 가로 8칸 + 세로 9칸을 간다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'CHA', file: 5, rank: 5 }]);
    const moves = generateChaMoves(board, at(5, 5));
    expect(moves).toHaveLength(17);
    for (const pos of [at(1, 5), at(9, 5), at(5, 1), at(5, 10)]) {
      expect(includesPosition(moves, pos)).toBe(true);
    }
  });

  it('아군을 만나면 그 앞에서 멈춘다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'CHA', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 3 },
    ]);
    const moves = generateChaMoves(board, at(5, 5));
    expect(includesPosition(moves, at(5, 4))).toBe(true);
    expect(includesPosition(moves, at(5, 3))).toBe(false);
    expect(includesPosition(moves, at(5, 2))).toBe(false);
  });

  it('적 기물은 잡고 그 자리에서 멈춘다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'CHA', file: 5, rank: 5 },
      { side: 'HAN', type: 'JOL', file: 5, rank: 3 },
    ]);
    const moves = generateChaMoves(board, at(5, 5));
    expect(includesPosition(moves, at(5, 3))).toBe(true);
    expect(includesPosition(moves, at(5, 2))).toBe(false);
  });

  it('궁성 귀퉁이에서 중앙을 지나 반대 귀퉁이까지 간다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'CHA', file: 4, rank: 1 }]);
    const moves = generateChaMoves(board, at(4, 1));
    expect(includesPosition(moves, at(5, 2))).toBe(true);
    expect(includesPosition(moves, at(6, 3))).toBe(true);
    expect(moves).toHaveLength(19); // 가로 8 + 세로 9 + 대각 2
  });

  it('궁성 중앙이 막히면 대각으로 나아갈 수 없다', () => {
    const blocked = buildBoard([
      { side: 'HAN', type: 'CHA', file: 4, rank: 1 },
      { side: 'HAN', type: 'SA', file: 5, rank: 2 },
    ]);
    const moves = generateChaMoves(blocked, at(4, 1));
    expect(includesPosition(moves, at(5, 2))).toBe(false);
    expect(includesPosition(moves, at(6, 3))).toBe(false);

    const enemyCenter = buildBoard([
      { side: 'HAN', type: 'CHA', file: 4, rank: 1 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 2 },
    ]);
    const captures = generateChaMoves(enemyCenter, at(4, 1));
    expect(includesPosition(captures, at(5, 2))).toBe(true);
    expect(includesPosition(captures, at(6, 3))).toBe(false);
  });

  it('궁성 대각선은 궁성 밖으로 이어지지 않는다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'CHA', file: 6, rank: 3 }]);
    const moves = generateChaMoves(board, at(6, 3));
    expect(includesPosition(moves, at(7, 4))).toBe(false);
    expectPositions(
      moves.filter((m) => m.file !== 6 && m.rank !== 3),
      [at(5, 2), at(4, 1)],
    );
  });
});
