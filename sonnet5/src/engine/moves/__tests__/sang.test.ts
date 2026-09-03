import { describe, expect, it } from 'vitest'
import { hasPos, pos, withPieces } from '../../testUtils'
import { generateSangMoves } from '../sang'

describe('generateSangMoves', () => {
  it('빈 보드 중앙에서는 8방향 모두 이동 가능하다', () => {
    const p = pos(5, 5)
    const board = withPieces([[p, { type: 'SANG', side: 'HAN' }]])
    const moves = generateSangMoves(board, p)
    expect(moves).toHaveLength(8)
  })

  it('다리(첫 직선 칸)가 막히면 그쪽 대각 2개가 모두 불가하다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'SANG', side: 'HAN' }],
      [pos(5, 4), { type: 'JOL', side: 'HAN' }], // 위쪽 다리
    ])
    const moves = generateSangMoves(board, p)
    expect(hasPos(moves, pos(3, 2))).toBe(false)
    expect(hasPos(moves, pos(7, 2))).toBe(false)
    expect(moves).toHaveLength(6)
  })

  it('눈(다리 다음 대각 지점)만 막히면 그 한쪽 경로만 불가하다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'SANG', side: 'HAN' }],
      [pos(4, 3), { type: 'JOL', side: 'HAN' }], // 좌상 눈만 막힘
    ])
    const moves = generateSangMoves(board, p)
    expect(hasPos(moves, pos(3, 2))).toBe(false) // 좌상 경로 차단
    expect(hasPos(moves, pos(7, 2))).toBe(true) // 우상 경로는 무관
    expect(moves).toHaveLength(7)
  })

  it('다리와 눈이 모두 열려 있으면 적 기물을 잡을 수 있다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'SANG', side: 'HAN' }],
      [pos(3, 2), { type: 'JOL', side: 'CHO' }],
    ])
    const moves = generateSangMoves(board, p)
    expect(hasPos(moves, pos(3, 2))).toBe(true)
  })

  it('도착 지점에 아군이 있으면 그 수만 제외된다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'SANG', side: 'HAN' }],
      [pos(3, 2), { type: 'JOL', side: 'HAN' }],
    ])
    const moves = generateSangMoves(board, p)
    expect(hasPos(moves, pos(3, 2))).toBe(false)
    expect(hasPos(moves, pos(7, 2))).toBe(true)
  })
})
