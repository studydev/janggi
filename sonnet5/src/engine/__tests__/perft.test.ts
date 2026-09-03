import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../board'
import { perft } from '../perft'

// 마상마상 조합을 "초기 국면"의 기준으로 고정한다.
// depth 1(=32)은 16개 기물을 모두 손으로 되짚어 검증했다(기물 이동 31개 + 패스 1개).
// depth 2, 3은 검증된 depth 1 위에서 얻은 값을 회귀 테스트 기준값으로 고정한다.
describe('perft(초기 국면, 마상마상 조합)', () => {
  it('depth 1: 손으로 검증한 31개 기물 이동 + 패스 1개 = 32', () => {
    const state = createInitialGameState('MSMS', 'MSMS')
    expect(perft(state, 1)).toBe(32)
  })

  it('depth 2, 3: 회귀 테스트 기준값으로 고정', () => {
    const state = createInitialGameState('MSMS', 'MSMS')
    expect(perft(state, 2)).toBe(1024)
    expect(perft(state, 3)).toBe(33506)
  })
})

