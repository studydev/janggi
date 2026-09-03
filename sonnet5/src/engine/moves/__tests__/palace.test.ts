import { describe, expect, it } from 'vitest'
import { hasPos, pos, withPieces } from '../../testUtils'
import { generateGungMoves } from '../palace'

describe('generateGungMoves (사도 동일 로직 공유)', () => {
  it('궁성 중앙에서는 8개 지점 모두로 이동 가능하다(직교 4 + 대각 4)', () => {
    const p = pos(5, 2)
    const board = withPieces([[p, { type: 'GUNG', side: 'HAN' }]])
    const moves = generateGungMoves(board, p)
    expect(moves).toHaveLength(8)
    for (const target of [pos(5, 1), pos(5, 3), pos(4, 2), pos(6, 2), pos(4, 1), pos(6, 1), pos(4, 3), pos(6, 3)]) {
      expect(hasPos(moves, target)).toBe(true)
    }
  })

  it('궁성 귀퉁이에서는 직교 2개 + 대각 1개만 가능하고 궁성을 벗어나지 않는다', () => {
    const p = pos(4, 1)
    const board = withPieces([[p, { type: 'GUNG', side: 'HAN' }]])
    const moves = generateGungMoves(board, p)
    expect(moves).toHaveLength(3)
    expect(hasPos(moves, pos(4, 2))).toBe(true)
    expect(hasPos(moves, pos(5, 1))).toBe(true)
    expect(hasPos(moves, pos(5, 2))).toBe(true)
    expect(hasPos(moves, pos(3, 1))).toBe(false) // 궁성 이탈 금지
  })

  it('대각선이 아닌 궁성 변 중앙에서는 대각 이동이 없다', () => {
    const p = pos(5, 1)
    const board = withPieces([[p, { type: 'GUNG', side: 'HAN' }]])
    const moves = generateGungMoves(board, p)
    expect(moves).toHaveLength(3) // (5,2),(4,1),(6,1) — 대각 없음
    expect(hasPos(moves, pos(5, 2))).toBe(true)
    expect(hasPos(moves, pos(4, 1))).toBe(true)
    expect(hasPos(moves, pos(6, 1))).toBe(true)
  })

  it('궁성 바로 밖으로는 나갈 수 없다', () => {
    const p = pos(5, 3)
    const board = withPieces([[p, { type: 'GUNG', side: 'HAN' }]])
    const moves = generateGungMoves(board, p)
    expect(hasPos(moves, pos(5, 4))).toBe(false)
  })
})
