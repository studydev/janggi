/**
 * 마(馬) 이동 규칙.
 * RULES.md: 「직선 1칸 + 대각 1칸. 첫 직선 칸에 기물이 있으면 막혀서 못 간다(다리 막힘).」
 */
import { describe, expect, it } from 'vitest';
import { generateMaMoves } from '../moves/ma';
import { at, boardWith, k, keys } from './helpers';

describe('마(MA)', () => {
  it('빈 보드 중앙에서 8수', () => {
    const board = boardWith([5, 5, 'MA', 'CHO']);
    expect(generateMaMoves(board, at(5, 5))).toHaveLength(8);
  });

  it('보드 밖으로는 나가지 않는다 (구석)', () => {
    const board = boardWith([1, 1, 'MA', 'HAN']);
    const moves = keys(generateMaMoves(board, at(1, 1)));
    expect(moves).toEqual(k([2, 3], [3, 2]));
  });

  it('다리 막힘: 위쪽 직선 칸이 막히면 위쪽 두 수가 사라진다', () => {
    const board = boardWith([5, 5, 'MA', 'CHO'], [5, 4, 'JOL', 'HAN']);
    const moves = keys(generateMaMoves(board, at(5, 5)));
    expect(moves).not.toContain('4,3');
    expect(moves).not.toContain('6,3');
    expect(moves).toHaveLength(6);
  });

  it('다리 막힘은 아군/적군을 가리지 않는다', () => {
    const board = boardWith([5, 5, 'MA', 'CHO'], [4, 5, 'JOL', 'CHO']);
    const moves = keys(generateMaMoves(board, at(5, 5)));
    expect(moves).not.toContain('3,4');
    expect(moves).not.toContain('3,6');
  });

  it('도착점의 아군은 잡을 수 없고, 적은 잡을 수 있다', () => {
    const board = boardWith([5, 5, 'MA', 'CHO'], [4, 3, 'JOL', 'CHO'], [6, 3, 'JOL', 'HAN']);
    const moves = keys(generateMaMoves(board, at(5, 5)));
    expect(moves).not.toContain('4,3');
    expect(moves).toContain('6,3');
  });

  it('도착점이 막혀 있어도 다리만 비면 다른 쪽으로는 갈 수 있다', () => {
    const board = boardWith([5, 5, 'MA', 'CHO'], [4, 3, 'JOL', 'CHO']);
    const moves = keys(generateMaMoves(board, at(5, 5)));
    expect(moves).toContain('6,3');
  });
});
