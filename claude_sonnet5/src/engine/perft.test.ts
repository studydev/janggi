import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { perft } from './perft'
import type { Formation } from './types'

/**
 * 회귀 기준값. 규칙 엔진을 바꿔 이 숫자가 달라지면, 왜 달라졌는지 설명할 수
 * 있어야 한다. (초기 국면, 한 수 쉬기 제외.)
 *
 * perft(1) = 31 은 손으로 검증: 병 13 + 궁 6 + 차 4 + 마 3 + 사 4 + 상 1 + 포 0.
 * (file 2·8 의 포는 앞에 병이 없고 -- 병은 file 1·3·5·7·9 -- 첫 기물이 상대 포라
 *  넘을 수 없어 초기 합법수가 0.)
 */
describe('perft — 초기 국면 (마상마상)', () => {
  it('perft(1) = 31', () => {
    expect(perft(createInitialState(), 1)).toBe(31)
  })

  it('perft(2) = 961', () => {
    expect(perft(createInitialState(), 2)).toBe(961)
  })

  it('perft(3) = 30506', () => {
    expect(perft(createInitialState(), 3)).toBe(30506)
  })
})

describe('perft — 다른 마상 배치도 결정적', () => {
  const cases: [Formation, number][] = [
    ['SMSM', 1],
    ['MSSM', 1],
    ['SMMS', 1],
  ]
  for (const [formation, depth] of cases) {
    it(`${formation} perft(${depth}) 는 안정적으로 계산된다`, () => {
      const a = perft(createInitialState({ hanFormation: formation, choFormation: formation }), depth)
      const b = perft(createInitialState({ hanFormation: formation, choFormation: formation }), depth)
      expect(a).toBe(b)
      expect(a).toBeGreaterThan(0)
    })
  }
})
