import { describe, expect, it } from 'vitest'
import { generateGungMoves, generateSaMoves } from './gung'
import { at, has, scene } from '../testkit'

describe('generateGungMoves / generateSaMoves (궁·사)', () => {
  it('궁성 중앙(대각선 위)에서 상하좌우 4 + 대각 4 = 8', () => {
    const board = scene({ '5,2': 'hK' })
    const moves = generateGungMoves(board, at(5, 2))
    expect(moves).toHaveLength(8)
    expect(has(moves, 4, 1)).toBe(true)
    expect(has(moves, 6, 3)).toBe(true)
  })

  it('궁성 변(대각선 아닌 점)에서는 대각 이동 불가', () => {
    const board = scene({ '4,2': 'hK' })
    const moves = generateGungMoves(board, at(4, 2))
    // 상하좌우 중 궁성 안: (4,1),(4,3),(5,2)
    expect([...moves.map((m) => `${m.file},${m.rank}`)].sort()).toEqual(['4,1', '4,3', '5,2'])
  })

  it('궁성을 벗어나는 이동은 없다', () => {
    const board = scene({ '4,1': 'hK' })
    const moves = generateGungMoves(board, at(4, 1))
    expect(has(moves, 3, 1)).toBe(false) // file 3 = 궁성 밖
    expect(has(moves, 4, 0)).toBe(false)
    expect(has(moves, 5, 2)).toBe(true) // 대각선 위
  })

  it('사(士)도 궁과 규칙이 동일하다', () => {
    const board = scene({ '4,1': 'hS' })
    const moves = generateSaMoves(board, at(4, 1))
    expect([...moves.map((m) => `${m.file},${m.rank}`)].sort()).toEqual(['4,2', '5,1', '5,2'])
  })

  it('초(楚) 궁성에서도 동일하게 동작한다', () => {
    const board = scene({ '5,9': 'cK' })
    expect(generateGungMoves(board, at(5, 9))).toHaveLength(8)
  })

  it('아군은 막고 적은 잡는다', () => {
    const board = scene({ '5,2': 'hK', '5,1': 'hS', '4,1': 'cJ' })
    const moves = generateGungMoves(board, at(5, 2))
    expect(has(moves, 5, 1)).toBe(false)
    expect(has(moves, 4, 1)).toBe(true)
  })
})
