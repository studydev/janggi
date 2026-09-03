/**
 * perft 회귀 테스트.
 *
 * 아래 기준값은 이 엔진이 산출한 값을 고정한 것이다. 규칙을 바꾸면 반드시 깨진다.
 * 값이 달라졌다면 「규칙을 의도적으로 바꿨는가」를 먼저 따져야 한다.
 *
 * 초기 국면 depth 1 = 31 은 손으로도 검산된다:
 *   차2+차2, 마2+마1, 상0+상1, 사2+사2, 궁6, 포0+포0, 졸 2+3+3+3+2 = 31
 * (초기 국면에서 두 포는 모두 움직일 수 없다. 세로로는 상대 포가, 가로로는 아군 포가
 *  첫 기물이라 넘을 수 없기 때문이다.)
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../board';
import { perft } from '../perft';
import { generateLegalMoves } from '../rules';
import type { HorseSetup } from '../types';

const BASELINE: Record<HorseSetup, [number, number, number]> = {
  MSMS: [31, 961, 30506],
  SMSM: [31, 961, 30506],
  MSSM: [31, 961, 30353],
  SMMS: [31, 961, 30659],
};

describe('perft (합법수 트리 노드 수)', () => {
  for (const [setup, expected] of Object.entries(BASELINE) as [HorseSetup, number[]][]) {
    it(`${setup} 배치 depth 1~3`, () => {
      const state = createInitialState(setup, setup);
      expect([perft(state, 1), perft(state, 2), perft(state, 3)]).toEqual(expected);
    });
  }

  it('depth 1 은 generateLegalMoves 길이와 같다', () => {
    const state = createInitialState('MSMS', 'MSMS');
    expect(perft(state, 1)).toBe(generateLegalMoves(state).length);
  });

  it('초기 국면에서 포는 한 수도 둘 수 없다', () => {
    const state = createInitialState('MSMS', 'MSMS');
    expect(generateLegalMoves(state).filter((m) => m.piece === 'PO')).toHaveLength(0);
  });

  it('초기 국면 수 분포', () => {
    const state = createInitialState('MSMS', 'MSMS');
    const byPiece = new Map<string, number>();
    for (const m of generateLegalMoves(state)) {
      byPiece.set(m.piece!, (byPiece.get(m.piece!) ?? 0) + 1);
    }
    expect(byPiece.get('CHA')).toBe(4);
    expect(byPiece.get('MA')).toBe(3);
    expect(byPiece.get('SANG')).toBe(1);
    expect(byPiece.get('SA')).toBe(4);
    expect(byPiece.get('GUNG')).toBe(6);
    expect(byPiece.get('JOL')).toBe(13);
    expect(byPiece.get('PO')).toBeUndefined();
  });
});
