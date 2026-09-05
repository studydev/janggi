import { describe, expect, it } from 'vitest';
import { createGame, makeMove, pass } from './index';
import { formatMove, pieceName, sideName } from './janggi-notation';

describe('기보 표기', () => {
  it('출발좌표, 기물명, 도착좌표를 표시한다', () => {
    const state = makeMove(createGame(), { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } });
    expect(formatMove(state.moveHistory[0]!)).toBe('(1, 7) 졸 → (1, 6)');
  });
  it('한 수 쉼과 진영별 기물명을 한글로 표시한다', () => {
    expect(formatMove(pass(createGame()).moveHistory[0]!)).toBe('초 한 수 쉼');
    expect(pieceName('JOL', 'HAN')).toBe('병');
    expect(pieceName('JOL', 'CHO')).toBe('졸');
    expect(sideName('HAN')).toBe('한');
    expect(sideName('CHO')).toBe('초');
  });
});
