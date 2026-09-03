/**
 * 랜덤 대국 대량 검증 (P6).
 *
 * 1000판을 끝까지 돌리면서, 매 수마다 규칙상 절대 일어나면 안 되는 일을 검사한다:
 *   - 궁이 잡히는 수가 합법수로 생성됨
 *   - 기물이 보드 밖으로 나감
 *   - 사/궁이 궁성을 벗어남
 *   - 포가 포를 넘거나 잡음
 *   - 졸/병이 뒤로 이동
 *   - makeMove 후 undo 가 원래 상태와 불일치
 */
import { describe, expect, it } from 'vitest';
import { getGameResult } from '../result';
import { playRandomGame, type Violation } from '../selfplay';
import { DEFAULT_CONFIG } from '../types';

const GAMES = 1000;

describe('랜덤 대국 소크 테스트', () => {
  it(`${GAMES}판을 규칙 위반 없이 완주한다`, () => {
    const failures: string[] = [];
    let totalPlies = 0;

    for (let seed = 1; seed <= GAMES; seed++) {
      const report = playRandomGame(seed, { validate: true });
      totalPlies += report.plies;

      for (const v of report.violations as Violation[]) {
        failures.push(`seed ${seed} [${v.ply}수] ${v.kind}: ${v.detail}`);
      }
      if (report.result.status === 'PLAYING') {
        failures.push(`seed ${seed}: 끝나지 않은 국면으로 종료했다`);
      }
      if (failures.length > 10) break;
    }

    expect(failures).toEqual([]);
    expect(totalPlies).toBeGreaterThan(GAMES * 10);
  });

  it('빅장을 끄면 대국이 더 길어지고, 외통·반복·수제한으로 끝난다', () => {
    const config = { ...DEFAULT_CONFIG, bikjangEnabled: false, maxPlies: 600 };
    const reasons = new Set<string>();

    for (let seed = 1; seed <= 30; seed++) {
      const report = playRandomGame(seed, { validate: true, config });
      expect(report.violations).toEqual([]);
      expect(getGameResult(report.finalState).status).not.toBe('PLAYING');
      reasons.add(report.result.reason);
    }

    expect(reasons.has('CHECKMATE')).toBe(true);
    expect(reasons.has('BIKJANG')).toBe(false);
  });
});
