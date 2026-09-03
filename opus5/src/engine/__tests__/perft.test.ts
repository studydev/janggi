import { describe, expect, it } from 'vitest';
import { perft } from '../perft';
import { createGame } from '../rules';

/**
 * 초기 국면(마상마상 / 마상마상)의 합법수 트리 크기.
 * depth 1의 31수는 손으로 센 값과 일치한다. 규칙을 고치면 이 숫자가 움직인다.
 */
describe('perft 회귀 기준값', () => {
  const initial = createGame({ hanSetup: 'MSMS', choSetup: 'MSMS' });

  it('depth 1 = 31', () => {
    expect(perft(initial, 1)).toBe(31);
  });

  it('depth 2 = 961', () => {
    expect(perft(initial, 2)).toBe(961);
  });

  it('depth 3 = 30506', () => {
    expect(perft(initial, 3)).toBe(30506);
  }, 30_000);

  it('depth 0은 국면 자신 하나다', () => {
    expect(perft(initial, 0)).toBe(1);
  });
});
