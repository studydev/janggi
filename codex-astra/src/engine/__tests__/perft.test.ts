import { describe, expect, it } from 'vitest';
import { agreeDraw, createGame, perft } from '../index';

describe('opening perft regression', () => {
  // Both sides MASANGMASANG, CHO to move, default rules. Count board moves only,
  // excluding pass. Opening depth 1 can also be checked by hand:
  // CHA 4 + MA 3 + SANG 1 + SA 4 + GUNG 6 + JOL 13 = 31.
  it.each([[0, 1], [1, 31], [2, 961], [3, 30142]])('depth %i has %i nodes', (depth, nodes) => {
    expect(perft(createGame(), depth)).toBe(nodes);
  });
  it('has no children after adjudication', () => {
    expect(perft(agreeDraw(createGame()), 1)).toBe(0);
  });
});
