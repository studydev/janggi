/**
 * 포(包) 이동 규칙 — 장기 구현에서 오류가 가장 잦은 기물.
 * RULES.md: 「이동과 공격 모두, 사이에 정확히 기물 1개(포대)를 넘어야 한다.
 *            포대가 0개거나 2개 이상이면 그 방향으로 갈 수 없다.
 *            포는 다른 포를 넘을 수 없다. 포는 다른 포를 잡을 수 없다.
 *            궁성 대각선에서도 같은 조건으로 이동 가능.」
 * (샹치처럼 "이동은 차, 공격만 넘기"로 구현하면 오답이다.)
 */
import { describe, expect, it } from 'vitest';
import { generatePoMoves } from '../moves/po';
import { at, boardWith, keys } from './helpers';

describe('포(PO)', () => {
  it('포대가 하나도 없으면 그 방향으로 갈 수 없다 (차처럼 움직이지 않는다)', () => {
    const board = boardWith([5, 5, 'PO', 'CHO']);
    expect(generatePoMoves(board, at(5, 5))).toHaveLength(0);
  });

  it('포대 1개를 넘어 빈 칸으로 이동한다', () => {
    const board = boardWith([1, 5, 'PO', 'CHO'], [3, 5, 'JOL', 'CHO']);
    const moves = keys(generatePoMoves(board, at(1, 5)));
    expect(moves).not.toContain('2,5'); // 포대 앞은 못 간다
    expect(moves).not.toContain('3,5'); // 포대 자리도 못 간다
    expect(moves).toContain('4,5');
    expect(moves).toContain('9,5');
    expect(moves).toHaveLength(6); // 4,5 ~ 9,5
  });

  it('포대를 넘어 적을 잡는다', () => {
    const board = boardWith([1, 5, 'PO', 'CHO'], [3, 5, 'JOL', 'CHO'], [6, 5, 'MA', 'HAN']);
    const moves = keys(generatePoMoves(board, at(1, 5)));
    expect(moves).toContain('6,5');
    expect(moves).not.toContain('7,5'); // 잡은 뒤엔 멈춘다
  });

  it('포대를 넘은 뒤 첫 기물이 아군이면 잡지 못하고 멈춘다', () => {
    const board = boardWith([1, 5, 'PO', 'CHO'], [3, 5, 'JOL', 'CHO'], [6, 5, 'MA', 'CHO']);
    const moves = keys(generatePoMoves(board, at(1, 5)));
    expect(moves).not.toContain('6,5');
    expect(moves).not.toContain('7,5');
    expect(moves).toEqual(['4,5', '5,5']);
  });

  it('사이에 기물이 2개면 그 방향으로 갈 수 없다', () => {
    const board = boardWith(
      [1, 5, 'PO', 'CHO'],
      [3, 5, 'JOL', 'CHO'],
      [4, 5, 'JOL', 'CHO'],
      [7, 5, 'MA', 'HAN'],
    );
    const moves = keys(generatePoMoves(board, at(1, 5)));
    expect(moves).toHaveLength(0);
  });

  it('포는 다른 포를 넘을 수 없다', () => {
    const board = boardWith([1, 5, 'PO', 'CHO'], [3, 5, 'PO', 'HAN']);
    expect(generatePoMoves(board, at(1, 5))).toHaveLength(0);
  });

  it('포는 다른 포를 잡을 수 없다 (아군 포도 마찬가지로 막는다)', () => {
    const board = boardWith([1, 5, 'PO', 'CHO'], [3, 5, 'JOL', 'CHO'], [6, 5, 'PO', 'HAN']);
    const moves = keys(generatePoMoves(board, at(1, 5)));
    expect(moves).not.toContain('6,5');
    expect(moves).not.toContain('7,5'); // 포에 막혀 더 못 간다
    expect(moves).toEqual(['4,5', '5,5']);
  });

  it('궁성 대각선: 귀퉁이에서 중앙 포대를 넘어 반대 귀퉁이로 간다', () => {
    const board = boardWith([4, 8, 'PO', 'CHO'], [5, 9, 'SA', 'CHO']);
    const moves = keys(generatePoMoves(board, at(4, 8)));
    expect(moves).toContain('6,10');
  });

  it('궁성 대각선: 중앙 포대가 포이면 넘지 못한다', () => {
    const board = boardWith([4, 8, 'PO', 'CHO'], [5, 9, 'PO', 'HAN']);
    const moves = keys(generatePoMoves(board, at(4, 8)));
    expect(moves).not.toContain('6,10');
  });

  it('궁성 중앙에서는 대각으로 넘을 대상이 없다 (한 걸음뿐)', () => {
    const board = boardWith([5, 9, 'PO', 'CHO'], [4, 8, 'SA', 'CHO'], [6, 10, 'SA', 'CHO']);
    const moves = keys(generatePoMoves(board, at(5, 9)));
    expect(moves).not.toContain('4,8');
    expect(moves).not.toContain('6,10');
  });

  it('세로 방향도 동일하게 동작한다', () => {
    const board = boardWith([5, 1, 'PO', 'HAN'], [5, 3, 'JOL', 'HAN'], [5, 8, 'CHA', 'CHO']);
    const moves = keys(generatePoMoves(board, at(5, 1)));
    expect(moves).toEqual(['5,4', '5,5', '5,6', '5,7', '5,8']);
  });
});
