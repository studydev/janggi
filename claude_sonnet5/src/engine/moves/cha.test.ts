import { describe, expect, it } from 'vitest'
import { generateChaMoves } from './cha'
import { at, has, scene } from '../testkit'

describe('generateChaMoves (차)', () => {
  it('빈 보드 중앙에서는 가로 8 + 세로 9 = 17칸', () => {
    const board = scene({ '5,5': 'cR' })
    const moves = generateChaMoves(board, at(5, 5))
    expect(moves).toHaveLength(17)
  })

  it('아군을 만나면 그 앞에서 멈춘다 (아군 칸 제외)', () => {
    const board = scene({ '5,5': 'cR', '5,8': 'cJ' })
    const moves = generateChaMoves(board, at(5, 5))
    expect(has(moves, 5, 7)).toBe(true)
    expect(has(moves, 5, 8)).toBe(false)
    expect(has(moves, 5, 9)).toBe(false)
  })

  it('적 기물은 잡고 멈춘다 (적 칸 포함, 그 너머 제외)', () => {
    const board = scene({ '5,5': 'cR', '5,8': 'hJ' })
    const moves = generateChaMoves(board, at(5, 5))
    expect(has(moves, 5, 8)).toBe(true)
    expect(has(moves, 5, 9)).toBe(false)
  })

  it('궁성 귀퉁이에서 중앙을 지나 반대 귀퉁이까지 대각 직진', () => {
    const board = scene({ '4,1': 'hR' })
    const moves = generateChaMoves(board, at(4, 1))
    expect(has(moves, 5, 2)).toBe(true)
    expect(has(moves, 6, 3)).toBe(true)
    // 궁성 밖으로는 이어지지 않는다.
    expect(has(moves, 7, 4)).toBe(false)
  })

  it('궁성 중앙에 적 기물이 있으면 잡되 그 너머 대각은 불가', () => {
    const board = scene({ '4,1': 'hR', '5,2': 'cP' })
    const moves = generateChaMoves(board, at(4, 1))
    expect(has(moves, 5, 2)).toBe(true)
    expect(has(moves, 6, 3)).toBe(false)
  })

  it('궁성 중앙에 아군이 있으면 대각 진행 자체가 막힘', () => {
    const board = scene({ '4,1': 'hR', '5,2': 'hS' })
    const moves = generateChaMoves(board, at(4, 1))
    expect(has(moves, 5, 2)).toBe(false)
    expect(has(moves, 6, 3)).toBe(false)
  })

  it('궁성 중앙 차는 네 귀퉁이로 모두 갈 수 있다', () => {
    const board = scene({ '5,9': 'cR' })
    const moves = generateChaMoves(board, at(5, 9))
    expect(has(moves, 4, 8)).toBe(true)
    expect(has(moves, 6, 8)).toBe(true)
    expect(has(moves, 4, 10)).toBe(true)
    expect(has(moves, 6, 10)).toBe(true)
  })
})
