import { describe, expect, it } from 'vitest'
import { runRandomGame, runRandomSuite } from './verification'

describe('랜덤 대국 불변식', () => {
  it('50판 동안 규칙 위반이 한 번도 없다', () => {
    // (npm run verify 는 1000판. 테스트는 CI 속도를 위해 50판.)
    const suite = runRandomSuite(50)
    if (suite.failures.length > 0) {
      const f = suite.failures[0]
      throw new Error(
        `seed ${f.seed} (${f.moves}수): ${f.violations.map((v) => `${v.kind} — ${v.detail}`).join('; ')}`,
      )
    }
    expect(suite.failures).toHaveLength(0)
  })

  it('대부분의 랜덤 대국은 종료 조건에 도달한다', () => {
    const suite = runRandomSuite(30)
    const ended = Object.entries(suite.endedByStatus)
      .filter(([k]) => k !== 'MAXMOVES')
      .reduce((n, [, c]) => n + c, 0)
    expect(ended).toBeGreaterThan(26)
  })

  it('같은 시드는 같은 대국을 만든다 (재현성)', () => {
    const a = runRandomGame(42)
    const b = runRandomGame(42)
    expect(a).toEqual(b)
  })
})
