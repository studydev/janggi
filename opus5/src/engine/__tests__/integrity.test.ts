import { describe, expect, it } from 'vitest';
import { createGame, makeMove, undoMove } from '../rules';
import { runRandomGames } from '../verification';
import { at } from './testUtils';

describe('엔진 무결성', () => {
  it('랜덤 대국 100판에서 규칙 위반이 없다', () => {
    const stats = runRandomGames({ games: 100, maxPlies: 200, seed: 20260903, undoChecks: 2 });
    expect(stats.violations).toEqual([]);
    expect(stats.totalPlies).toBeGreaterThan(1000);
  }, 120_000);

  it('연속 착수 후 undo를 반복하면 초기 상태로 정확히 돌아온다', () => {
    const initial = createGame();
    const moves = [
      { from: at(1, 7), to: at(1, 6) },
      { from: at(1, 4), to: at(1, 5) },
      { from: at(2, 10), to: at(1, 8) },
      { from: at(2, 1), to: at(1, 3) },
    ];

    const states = [initial];
    let state = initial;
    for (const move of moves) {
      state = makeMove(state, move);
      states.push(state);
    }
    for (let i = moves.length; i > 0; i -= 1) {
      state = undoMove(state);
      expect(state).toEqual(states[i - 1]);
    }
  });
});
