import { describe, expect, it } from 'vitest';
import { generatePoMoves } from '../moves/po';
import { at, buildBoard, includesPosition } from './testUtils';

describe('포(包) 이동', () => {
  it('포대가 없으면 그 방향으로 갈 수 없다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'PO', file: 5, rank: 5 }]);
    expect(generatePoMoves(board, at(5, 5))).toHaveLength(0);
  });

  it('포대를 정확히 하나 넘어 이동한다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 3 },
    ]);
    const moves = generatePoMoves(board, at(5, 5));
    expect(includesPosition(moves, at(5, 2))).toBe(true);
    expect(includesPosition(moves, at(5, 1))).toBe(true);
    expect(includesPosition(moves, at(5, 4))).toBe(false); // 포대 앞
    expect(includesPosition(moves, at(5, 3))).toBe(false); // 포대 자리
  });

  it('포대 너머 첫 기물이 적이면 잡고, 아군이면 막힌다', () => {
    const capture = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 4 },
      { side: 'HAN', type: 'MA', file: 5, rank: 2 },
    ]);
    const moves = generatePoMoves(capture, at(5, 5));
    expect(includesPosition(moves, at(5, 3))).toBe(true);
    expect(includesPosition(moves, at(5, 2))).toBe(true);
    expect(includesPosition(moves, at(5, 1))).toBe(false);

    const blocked = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 4 },
      { side: 'CHO', type: 'MA', file: 5, rank: 3 },
    ]);
    const blockedMoves = generatePoMoves(blocked, at(5, 5));
    expect(includesPosition(blockedMoves, at(5, 3))).toBe(false);
    expect(includesPosition(blockedMoves, at(5, 2))).toBe(false);
  });

  it('사이에 기물이 2개면 그 너머로 갈 수 없다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 4 },
      { side: 'CHO', type: 'SA', file: 5, rank: 3 },
    ]);
    const moves = generatePoMoves(board, at(5, 5));
    expect(includesPosition(moves, at(5, 2))).toBe(false);
    expect(includesPosition(moves, at(5, 1))).toBe(false);
  });

  it('포는 포를 넘을 수 없다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 5 },
      { side: 'HAN', type: 'PO', file: 5, rank: 3 },
    ]);
    expect(generatePoMoves(board, at(5, 5))).toHaveLength(0);
  });

  it('포는 포를 잡을 수 없다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 5 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 4 },
      { side: 'HAN', type: 'PO', file: 5, rank: 2 },
    ]);
    const moves = generatePoMoves(board, at(5, 5));
    expect(includesPosition(moves, at(5, 3))).toBe(true);
    expect(includesPosition(moves, at(5, 2))).toBe(false);
    expect(includesPosition(moves, at(5, 1))).toBe(false);
  });

  it('궁성 대각선에서는 중앙의 포대를 넘어 반대 귀퉁이로 간다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'PO', file: 4, rank: 10 },
      { side: 'CHO', type: 'SA', file: 5, rank: 9 },
    ]);
    expect(includesPosition(generatePoMoves(board, at(4, 10)), at(6, 8))).toBe(true);

    const poScreen = buildBoard([
      { side: 'CHO', type: 'PO', file: 4, rank: 10 },
      { side: 'HAN', type: 'PO', file: 5, rank: 9 },
    ]);
    expect(includesPosition(generatePoMoves(poScreen, at(4, 10)), at(6, 8))).toBe(false);
  });

  it('궁성 중앙에서는 넘을 포대가 없어 대각으로 못 간다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'PO', file: 5, rank: 9 },
      { side: 'CHO', type: 'SA', file: 6, rank: 8 },
    ]);
    const moves = generatePoMoves(board, at(5, 9));
    expect(includesPosition(moves, at(6, 8))).toBe(false);
    expect(includesPosition(moves, at(4, 10))).toBe(false);
  });
});
