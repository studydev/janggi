import { describe, expect, it } from 'vitest'
import { hasPos, pos, withPieces } from '../../testUtils'
import { generateChaMoves } from '../cha'

describe('generateChaMoves', () => {
  it('빈 보드 중앙(궁성 밖)에서는 가로+세로 전체가 이동 가능하다', () => {
    const p = pos(5, 5)
    const board = withPieces([[p, { type: 'CHA', side: 'HAN' }]])
    const moves = generateChaMoves(board, p)
    expect(moves).toHaveLength(17) // 세로 9칸(자신 제외) + 가로 8칸(자신 제외)
  })

  it('아군에 막히면 그 지점 앞에서 멈춘다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'CHA', side: 'HAN' }],
      [pos(5, 7), { type: 'JOL', side: 'HAN' }],
    ])
    const moves = generateChaMoves(board, p)
    expect(hasPos(moves, pos(5, 6))).toBe(true)
    expect(hasPos(moves, pos(5, 7))).toBe(false)
    expect(hasPos(moves, pos(5, 8))).toBe(false)
  })

  it('적 기물은 그 지점까지 포함해 잡을 수 있다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'CHA', side: 'HAN' }],
      [pos(5, 7), { type: 'JOL', side: 'CHO' }],
    ])
    const moves = generateChaMoves(board, p)
    expect(hasPos(moves, pos(5, 6))).toBe(true)
    expect(hasPos(moves, pos(5, 7))).toBe(true) // 잡는 수
    expect(hasPos(moves, pos(5, 8))).toBe(false)
  })

  it('궁성 귀퉁이에서 중앙을 지나 반대 귀퉁이까지 대각선으로 이동할 수 있다', () => {
    const p = pos(4, 1) // 한 궁성 귀퉁이
    const board = withPieces([[p, { type: 'CHA', side: 'HAN' }]])
    const moves = generateChaMoves(board, p)
    expect(hasPos(moves, pos(5, 2))).toBe(true) // 궁성 중앙
    expect(hasPos(moves, pos(6, 3))).toBe(true) // 반대 귀퉁이
    expect(moves).toHaveLength(19) // 세로 9 + 가로 8 + 대각 2
  })

  it('궁성 중앙에 아군이 있으면 대각 진행이 완전히 막힌다', () => {
    const p = pos(4, 1)
    const board = withPieces([
      [p, { type: 'CHA', side: 'HAN' }],
      [pos(5, 2), { type: 'SA', side: 'HAN' }],
    ])
    const moves = generateChaMoves(board, p)
    expect(hasPos(moves, pos(5, 2))).toBe(false)
    expect(hasPos(moves, pos(6, 3))).toBe(false)
    expect(moves).toHaveLength(17) // 대각선 기여 0
  })

  it('궁성 중앙에 적이 있으면 그 지점만 잡고 더 못 간다', () => {
    const p = pos(4, 1)
    const board = withPieces([
      [p, { type: 'CHA', side: 'HAN' }],
      [pos(5, 2), { type: 'SA', side: 'CHO' }],
    ])
    const moves = generateChaMoves(board, p)
    expect(hasPos(moves, pos(5, 2))).toBe(true)
    expect(hasPos(moves, pos(6, 3))).toBe(false)
  })
})
