/**
 * 차(車) 이동 규칙.
 * RULES.md: 「가로·세로로 막힐 때까지 직진. 궁성 안 대각선 위에 있으면
 *            그 대각선을 따라 직진 가능. 궁성 대각선은 궁성 밖으로 이어지지 않는다.」
 */
import { describe, expect, it } from 'vitest';
import { generateChaMoves } from '../moves/cha';
import { at, boardWith, k, keys } from './helpers';

describe('차(CHA)', () => {
  it('1) 빈 보드 중앙(5,5)에서는 가로 8 + 세로 9 = 17수', () => {
    const board = boardWith([5, 5, 'CHA', 'CHO']);
    const moves = generateChaMoves(board, at(5, 5));
    expect(moves).toHaveLength(17);
  });

  it('2) 아군을 만나면 그 앞에서 멈춘다', () => {
    const board = boardWith([1, 5, 'CHA', 'CHO'], [4, 5, 'JOL', 'CHO']);
    const moves = keys(generateChaMoves(board, at(1, 5)));
    expect(moves).toContain('2,5');
    expect(moves).toContain('3,5');
    expect(moves).not.toContain('4,5');
    expect(moves).not.toContain('5,5');
  });

  it('3) 적 기물은 잡고 멈춘다', () => {
    const board = boardWith([1, 5, 'CHA', 'CHO'], [4, 5, 'JOL', 'HAN']);
    const moves = keys(generateChaMoves(board, at(1, 5)));
    expect(moves).toContain('4,5');
    expect(moves).not.toContain('5,5');
  });

  it('4) 궁성 귀퉁이에서 중앙을 지나 반대 귀퉁이까지 간다', () => {
    const board = boardWith([4, 1, 'CHA', 'HAN']);
    const moves = keys(generateChaMoves(board, at(4, 1)));
    expect(moves).toContain('5,2');
    expect(moves).toContain('6,3');
    // 궁성 대각선은 궁성 밖으로 이어지지 않는다
    expect(moves).not.toContain('7,4');
    expect(moves).not.toContain('3,0');
    expect(moves).toHaveLength(19); // 세로 9 + 가로 8 + 대각 2
  });

  it('5) 궁성 중앙에 아군이 있으면 대각 진행이 완전히 막힌다', () => {
    const board = boardWith([4, 1, 'CHA', 'HAN'], [5, 2, 'SA', 'HAN']);
    const moves = keys(generateChaMoves(board, at(4, 1)));
    expect(moves).not.toContain('5,2');
    expect(moves).not.toContain('6,3');
  });

  it('5-b) 궁성 중앙에 적이 있으면 그 적까지만 간다', () => {
    const board = boardWith([4, 1, 'CHA', 'HAN'], [5, 2, 'SA', 'CHO']);
    const moves = keys(generateChaMoves(board, at(4, 1)));
    expect(moves).toContain('5,2');
    expect(moves).not.toContain('6,3');
  });

  it('궁성 중앙에서는 네 귀퉁이로 모두 갈 수 있다', () => {
    const board = boardWith([5, 9, 'CHA', 'CHO']);
    const moves = keys(generateChaMoves(board, at(5, 9)));
    expect(moves).toEqual(expect.arrayContaining(k([4, 8], [6, 8], [4, 10], [6, 10])));
  });

  it('궁성 대각선 위가 아니면(예: 궁성 변 중앙) 대각 이동이 없다', () => {
    const board = boardWith([4, 2, 'CHA', 'HAN']);
    const moves = keys(generateChaMoves(board, at(4, 2)));
    expect(moves).not.toContain('5,1');
    expect(moves).not.toContain('5,3');
    expect(moves).not.toContain('3,1');
  });
});
