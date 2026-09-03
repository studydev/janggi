import { describe, expect, it } from 'vitest'
import { generatePoMoves } from './po'
import { at, has, keys, scene } from '../testkit'

describe('generatePoMoves (포)', () => {
  it('포대가 없으면 그 방향으로 갈 수 없다', () => {
    const board = scene({ '5,5': 'cP' }) // 혼자
    expect(generatePoMoves(board, at(5, 5))).toHaveLength(0)
  })

  it('사이에 정확히 1개면 그 너머로 이동한다', () => {
    const board = scene({ '5,5': 'cP', '5,7': 'cJ' })
    const moves = generatePoMoves(board, at(5, 5))
    // 포대(5,7) 너머 빈 칸: (5,8),(5,9),(5,10)
    expect(has(moves, 5, 8)).toBe(true)
    expect(has(moves, 5, 9)).toBe(true)
    expect(has(moves, 5, 10)).toBe(true)
    // 포대 앞이나 포대 자리로는 못 간다.
    expect(has(moves, 5, 6)).toBe(false)
    expect(has(moves, 5, 7)).toBe(false)
  })

  it('포대 너머 적 기물은 잡을 수 있다', () => {
    const board = scene({ '5,5': 'cP', '5,7': 'cJ', '5,9': 'hR' })
    const moves = generatePoMoves(board, at(5, 5))
    expect(has(moves, 5, 8)).toBe(true)
    expect(has(moves, 5, 9)).toBe(true) // 车 포획
    expect(has(moves, 5, 10)).toBe(false) // 그 너머는 불가
  })

  it('사이에 2개면 그 방향으로 갈 수 없다', () => {
    const board = scene({ '5,5': 'cP', '5,7': 'cJ', '5,8': 'cJ' })
    const moves = generatePoMoves(board, at(5, 5))
    expect(keys(moves).filter((k) => k.startsWith('5,'))).toHaveLength(0)
  })

  it('포대가 포이면 넘을 수 없다', () => {
    const board = scene({ '5,5': 'cP', '5,7': 'hP', '5,9': 'hR' })
    expect(generatePoMoves(board, at(5, 5))).toHaveLength(0)
  })

  it('포대 너머의 기물이 포이면 잡을 수 없다', () => {
    const board = scene({ '5,5': 'cP', '5,7': 'cJ', '5,9': 'hP' })
    const moves = generatePoMoves(board, at(5, 5))
    expect(has(moves, 5, 8)).toBe(true)
    expect(has(moves, 5, 9)).toBe(false) // 包 포획 불가
  })

  it('빈 칸을 지나 포대를 찾은 뒤에도 규칙은 동일하다 (먼 포대)', () => {
    const board = scene({ '3,5': 'cP', '6,5': 'cJ', '8,5': 'hM' })
    const moves = generatePoMoves(board, at(3, 5))
    expect(has(moves, 7, 5)).toBe(true)
    expect(has(moves, 8, 5)).toBe(true) // 馬 포획
    expect(has(moves, 9, 5)).toBe(false)
  })

  it('궁성 대각선: 귀퉁이 포가 중앙 포대를 넘어 반대 귀퉁이로', () => {
    const board = scene({ '4,8': 'cP', '5,9': 'hM' }) // 중앙에 포대(마)
    const moves = generatePoMoves(board, at(4, 8))
    expect(has(moves, 6, 10)).toBe(true)
  })

  it('궁성 대각선: 중앙 포대가 포이면 넘을 수 없다', () => {
    const board = scene({ '4,8': 'cP', '5,9': 'hP' })
    const moves = generatePoMoves(board, at(4, 8))
    expect(has(moves, 6, 10)).toBe(false)
  })
})
