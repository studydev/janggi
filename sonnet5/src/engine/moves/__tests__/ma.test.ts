import { describe, expect, it } from 'vitest'
import { hasPos, pos, withPieces } from '../../testUtils'
import { generateMaMoves } from '../ma'

describe('generateMaMoves', () => {
  it('빈 보드 중앙에서는 8방향 모두 이동 가능하다', () => {
    const p = pos(5, 5)
    const board = withPieces([[p, { type: 'MA', side: 'HAN' }]])
    const moves = generateMaMoves(board, p)
    expect(moves).toHaveLength(8)
  })

  it('다리(첫 직선 칸)가 막히면 그쪽 대각 이동 2개가 모두 불가하다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'MA', side: 'HAN' }],
      [pos(5, 4), { type: 'JOL', side: 'HAN' }], // 위쪽 다리 막힘
    ])
    const moves = generateMaMoves(board, p)
    expect(hasPos(moves, pos(4, 3))).toBe(false)
    expect(hasPos(moves, pos(6, 3))).toBe(false)
    expect(moves).toHaveLength(6)
  })

  it('다리가 열려 있으면 적 기물을 잡을 수 있다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'MA', side: 'HAN' }],
      [pos(4, 3), { type: 'JOL', side: 'CHO' }],
    ])
    const moves = generateMaMoves(board, p)
    expect(hasPos(moves, pos(4, 3))).toBe(true)
  })

  it('도착 지점에 아군이 있으면 그 지점만 제외된다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'MA', side: 'HAN' }],
      [pos(6, 3), { type: 'JOL', side: 'HAN' }],
    ])
    const moves = generateMaMoves(board, p)
    expect(hasPos(moves, pos(6, 3))).toBe(false)
    expect(hasPos(moves, pos(4, 3))).toBe(true) // 같은 다리를 쓰는 다른 대각은 영향 없음
  })

  it('보드 귀퉁이에서는 보드를 벗어나는 이동이 걸러진다', () => {
    const p = pos(1, 1)
    const board = withPieces([[p, { type: 'MA', side: 'HAN' }]])
    const moves = generateMaMoves(board, p)
    expect(moves).toHaveLength(2)
    expect(hasPos(moves, pos(2, 3))).toBe(true)
    expect(hasPos(moves, pos(3, 2))).toBe(true)
  })
})
