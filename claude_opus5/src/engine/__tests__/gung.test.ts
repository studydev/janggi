/**
 * 궁(將)과 사(士) 이동 규칙.
 * RULES.md: 「궁성 안에서만 선을 따라 1칸. 궁성 대각선 위에서는 대각으로도 1칸.」
 *           「사(士): 궁과 동일. 궁성을 벗어날 수 없다.」
 */
import { describe, expect, it } from 'vitest';
import { generateGungMoves, generateSaMoves } from '../moves/gung';
import { at, boardWith, k, keys } from './helpers';

describe('궁(GUNG)', () => {
  it('궁성 중앙에서는 상하좌우 4 + 대각 4 = 8수', () => {
    const board = boardWith([5, 2, 'GUNG', 'HAN']);
    const moves = keys(generateGungMoves(board, at(5, 2)));
    expect(moves).toEqual(k([4, 1], [5, 1], [6, 1], [4, 2], [6, 2], [4, 3], [5, 3], [6, 3]));
  });

  it('궁성을 벗어나지 못한다 (중앙에서 rank 4로 못 감)', () => {
    const board = boardWith([5, 3, 'GUNG', 'HAN']);
    const moves = keys(generateGungMoves(board, at(5, 3)));
    expect(moves).not.toContain('5,4');
    expect(moves).not.toContain('4,4');
    expect(moves).toEqual(k([4, 3], [6, 3], [5, 2]));
  });

  it('궁성 변 중앙(대각선 위가 아님)에서는 대각 이동이 없다', () => {
    const board = boardWith([4, 2, 'GUNG', 'HAN']);
    const moves = keys(generateGungMoves(board, at(4, 2)));
    expect(moves).toEqual(k([4, 1], [4, 3], [5, 2]));
    expect(moves).not.toContain('5,1');
    expect(moves).not.toContain('5,3');
  });

  it('궁성 귀퉁이에서는 중앙으로만 대각 이동한다', () => {
    const board = boardWith([4, 1, 'GUNG', 'HAN']);
    const moves = keys(generateGungMoves(board, at(4, 1)));
    expect(moves).toEqual(k([5, 1], [4, 2], [5, 2]));
  });

  it('아군은 잡을 수 없고 적은 잡을 수 있다', () => {
    const board = boardWith([5, 2, 'GUNG', 'HAN'], [5, 1, 'SA', 'HAN'], [4, 1, 'JOL', 'CHO']);
    const moves = keys(generateGungMoves(board, at(5, 2)));
    expect(moves).not.toContain('5,1');
    expect(moves).toContain('4,1');
  });

  it('초(楚)의 궁은 아래쪽 궁성(rank 8~10)에 갇힌다', () => {
    const board = boardWith([5, 9, 'GUNG', 'CHO']);
    const moves = keys(generateGungMoves(board, at(5, 9)));
    expect(moves).toEqual(k([4, 8], [5, 8], [6, 8], [4, 9], [6, 9], [4, 10], [5, 10], [6, 10]));
    expect(moves).not.toContain('5,7');
  });
});

describe('사(SA)', () => {
  it('궁과 완전히 같은 이동을 한다', () => {
    const board = boardWith([5, 2, 'SA', 'HAN']);
    expect(keys(generateSaMoves(board, at(5, 2)))).toEqual(
      k([4, 1], [5, 1], [6, 1], [4, 2], [6, 2], [4, 3], [5, 3], [6, 3]),
    );
  });

  it('자기 궁성을 벗어날 수 없다', () => {
    const board = boardWith([4, 3, 'SA', 'HAN']);
    const moves = keys(generateSaMoves(board, at(4, 3)));
    expect(moves).toEqual(k([4, 2], [5, 3], [5, 2]));
    expect(moves).not.toContain('3,3');
    expect(moves).not.toContain('4,4');
  });
});
