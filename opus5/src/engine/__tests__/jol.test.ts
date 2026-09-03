import { describe, expect, it } from 'vitest';
import { generateJolMoves } from '../moves/jol';
import { at, buildBoard, expectPositions, includesPosition } from './testUtils';

describe('졸/병(卒/兵) 이동', () => {
  it('초의 졸은 위로 전진하고 좌우로 갈 수 있으며 뒤로는 못 간다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'JOL', file: 5, rank: 5 }]);
    const moves = generateJolMoves(board, at(5, 5));
    expectPositions(moves, [at(5, 4), at(4, 5), at(6, 5)]);
    expect(includesPosition(moves, at(5, 6))).toBe(false);
  });

  it('한의 병은 아래로 전진한다', () => {
    const board = buildBoard([{ side: 'HAN', type: 'JOL', file: 5, rank: 5 }]);
    const moves = generateJolMoves(board, at(5, 5));
    expectPositions(moves, [at(5, 6), at(4, 5), at(6, 5)]);
  });

  it('보드 밖과 아군 자리로는 가지 않는다', () => {
    const board = buildBoard([
      { side: 'CHO', type: 'JOL', file: 1, rank: 1 },
      { side: 'CHO', type: 'CHA', file: 2, rank: 1 },
    ]);
    expect(generateJolMoves(board, at(1, 1))).toHaveLength(0);
  });

  it('상대 궁성 대각선 위에서는 대각으로 전진한다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'JOL', file: 5, rank: 2 }]);
    const moves = generateJolMoves(board, at(5, 2));
    expectPositions(moves, [at(5, 1), at(4, 2), at(6, 2), at(4, 1), at(6, 1)]);
  });

  it('대각 후퇴는 할 수 없다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'JOL', file: 4, rank: 3 }]);
    const moves = generateJolMoves(board, at(4, 3));
    expect(includesPosition(moves, at(5, 2))).toBe(true);
    expect(includesPosition(moves, at(5, 4))).toBe(false);
  });

  it('자기 궁성 대각선에서는 대각으로 가지 못한다', () => {
    const board = buildBoard([{ side: 'CHO', type: 'JOL', file: 5, rank: 9 }]);
    const moves = generateJolMoves(board, at(5, 9));
    expectPositions(moves, [at(5, 8), at(4, 9), at(6, 9)]);
  });
});
