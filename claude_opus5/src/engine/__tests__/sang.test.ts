/**
 * 상(象) 이동 규칙 — 샹치와 가장 크게 다른 기물.
 * RULES.md: 「직선 1칸 + 대각 2칸. 경로상 중간 두 지점 중 하나라도 막히면 못 간다.」
 * (샹치의 "2칸 대각"으로 구현하면 오답. 강(河)도 없으므로 진영 제한이 없다.)
 */
import { describe, expect, it } from 'vitest';
import { generateSangMoves } from '../moves/sang';
import { at, boardWith, k, keys } from './helpers';

describe('상(SANG)', () => {
  it('빈 보드 중앙에서 8수, 각 수는 (2,3) 또는 (3,2) 벡터', () => {
    const board = boardWith([5, 5, 'SANG', 'CHO']);
    const moves = generateSangMoves(board, at(5, 5));
    expect(moves).toHaveLength(8);
    for (const m of moves) {
      const df = Math.abs(m.file - 5);
      const dr = Math.abs(m.rank - 5);
      expect([df, dr].sort().join(',')).toBe('2,3');
    }
  });

  it('강(河)이 없으므로 상대 진영 깊숙이도 갈 수 있다', () => {
    const board = boardWith([5, 6, 'SANG', 'CHO']);
    const moves = keys(generateSangMoves(board, at(5, 6)));
    expect(moves).toContain('3,3');
    expect(moves).toContain('7,3');
  });

  it('첫 번째 중간 지점(직선 1칸)이 막히면 그 방향 두 수가 사라진다', () => {
    const board = boardWith([5, 5, 'SANG', 'CHO'], [5, 4, 'JOL', 'HAN']);
    const moves = keys(generateSangMoves(board, at(5, 5)));
    expect(moves).not.toContain('3,2');
    expect(moves).not.toContain('7,2');
    expect(moves).toHaveLength(6);
  });

  it('두 번째 중간 지점(대각 1칸)이 막히면 그 한 수만 사라진다', () => {
    // (4,3) 은 「위로 1칸 -> 왼쪽위 대각」 경로의 두 번째 중간 지점이며, 다른 경로와 겹치지 않는다.
    const board = boardWith([5, 5, 'SANG', 'CHO'], [4, 3, 'JOL', 'HAN']);
    const moves = keys(generateSangMoves(board, at(5, 5)));
    expect(moves).not.toContain('3,2'); // 이 경로만 차단된다
    expect(moves).toContain('7,2'); // 위-오른쪽은 살아 있다
    expect(moves).toContain('2,3'); // 왼쪽-위도 살아 있다
    expect(moves).toHaveLength(7);
  });

  it('도착점의 아군은 잡을 수 없고, 적은 잡을 수 있다', () => {
    const board = boardWith([5, 5, 'SANG', 'CHO'], [3, 2, 'JOL', 'CHO'], [7, 2, 'JOL', 'HAN']);
    const moves = keys(generateSangMoves(board, at(5, 5)));
    expect(moves).not.toContain('3,2');
    expect(moves).toContain('7,2');
  });

  it('구석에서는 보드 안쪽 수만 남는다', () => {
    const board = boardWith([1, 1, 'SANG', 'HAN']);
    const moves = keys(generateSangMoves(board, at(1, 1)));
    expect(moves).toEqual(k([3, 4], [4, 3]));
  });
});
