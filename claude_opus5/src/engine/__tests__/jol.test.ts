/**
 * 졸(卒) / 병(兵) 이동 규칙.
 * RULES.md: 「앞 또는 좌우로 1칸. 뒤로 갈 수 없다.
 *            상대 궁성 안의 대각선 위에서는 대각으로 전진할 수 있다.」
 * (샹치처럼 "강을 건너야 옆으로 이동"으로 구현하면 오답 — 장기는 처음부터 좌우 이동 가능.)
 */
import { describe, expect, it } from 'vitest';
import { generateJolMoves } from '../moves/jol';
import { at, boardWith, k, keys } from './helpers';

describe('졸/병(JOL)', () => {
  it('초(楚)의 졸은 위(rank-1)로 전진하고, 처음부터 좌우로도 갈 수 있다', () => {
    const board = boardWith([5, 7, 'JOL', 'CHO']);
    const moves = keys(generateJolMoves(board, at(5, 7)));
    expect(moves).toEqual(k([5, 6], [4, 7], [6, 7]));
  });

  it('초의 졸은 뒤(rank+1)로 갈 수 없다', () => {
    const board = boardWith([5, 5, 'JOL', 'CHO']);
    expect(keys(generateJolMoves(board, at(5, 5)))).not.toContain('5,6');
  });

  it('한(漢)의 병은 아래(rank+1)로 전진한다', () => {
    const board = boardWith([5, 4, 'JOL', 'HAN']);
    const moves = keys(generateJolMoves(board, at(5, 4)));
    expect(moves).toEqual(k([5, 5], [4, 4], [6, 4]));
    expect(moves).not.toContain('5,3');
  });

  it('대각선은 기본적으로 불가하다', () => {
    const board = boardWith([5, 5, 'JOL', 'CHO']);
    const moves = keys(generateJolMoves(board, at(5, 5)));
    expect(moves).not.toContain('4,4');
    expect(moves).not.toContain('6,4');
  });

  it('상대 궁성 귀퉁이에서는 중앙으로 대각 전진할 수 있다', () => {
    // 초의 졸이 한 궁성 귀퉁이 (4,3) 에 있다 -> 중앙 (5,2)
    const board = boardWith([4, 3, 'JOL', 'CHO']);
    const moves = keys(generateJolMoves(board, at(4, 3)));
    expect(moves).toContain('5,2');
    expect(moves).toEqual(k([4, 2], [3, 3], [5, 3], [5, 2]));
  });

  it('상대 궁성 중앙에서는 앞쪽 두 귀퉁이로 대각 전진할 수 있다', () => {
    const board = boardWith([5, 2, 'JOL', 'CHO']);
    const moves = keys(generateJolMoves(board, at(5, 2)));
    expect(moves).toContain('4,1');
    expect(moves).toContain('6,1');
    expect(moves).not.toContain('4,3'); // 뒤쪽 대각은 불가
    expect(moves).not.toContain('6,3');
  });

  it('자기 궁성 대각선 위에서는 대각 이동이 생기지 않는다', () => {
    // 한의 병이 자기 궁성 중앙에 있는 상황 (전진 방향은 rank+1)
    const board = boardWith([5, 2, 'JOL', 'HAN']);
    const moves = keys(generateJolMoves(board, at(5, 2)));
    expect(moves).not.toContain('4,3');
    expect(moves).not.toContain('6,3');
    expect(moves).toEqual(k([5, 3], [4, 2], [6, 2]));
  });

  it('보드 가장자리를 넘지 않고, 아군은 잡지 못하며 적은 잡는다', () => {
    const board = boardWith([1, 1, 'JOL', 'HAN'], [2, 1, 'JOL', 'HAN'], [1, 2, 'CHA', 'CHO']);
    const moves = keys(generateJolMoves(board, at(1, 1)));
    expect(moves).toEqual(k([1, 2]));
  });
});
