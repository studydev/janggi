import { describe, expect, it } from 'vitest'
import { generateSangMoves } from './sang'
import { at, has, scene } from '../testkit'

describe('generateSangMoves (상)', () => {
  it('빈 보드 중앙에서 8방향 (1직진 + 2대각)', () => {
    const board = scene({ '5,5': 'cE' })
    const moves = generateSangMoves(board, at(5, 5))
    expect(moves).toHaveLength(8)
    // 대표 목적지 몇 개.
    expect(has(moves, 3, 2)).toBe(true)
    expect(has(moves, 7, 8)).toBe(true)
    expect(has(moves, 2, 7)).toBe(true)
  })

  it('첫 직진 칸이 막히면 그 방향 2목적지가 사라진다', () => {
    const board = scene({ '5,5': 'cE', '5,4': 'hJ' })
    const moves = generateSangMoves(board, at(5, 5))
    expect(has(moves, 3, 2)).toBe(false)
    expect(has(moves, 7, 2)).toBe(false)
    expect(moves).toHaveLength(6)
  })

  it('중간(2번째) 지점이 막히면 해당 목적지만 사라진다', () => {
    const board = scene({ '5,5': 'cE', '4,3': 'hJ' }) // up-left 경로의 중간
    const moves = generateSangMoves(board, at(5, 5))
    expect(has(moves, 3, 2)).toBe(false) // 막힘
    expect(has(moves, 7, 2)).toBe(true) // up-right 은 그대로
    expect(moves).toHaveLength(7)
  })

  it('목적지의 적은 잡고 아군은 막는다', () => {
    const board = scene({ '5,5': 'cE', '3,2': 'hR', '7,2': 'cR' })
    const moves = generateSangMoves(board, at(5, 5))
    expect(has(moves, 3, 2)).toBe(true)
    expect(has(moves, 7, 2)).toBe(false)
  })

  it('구석에서는 보드 밖 목적지가 잘린다', () => {
    const board = scene({ '1,1': 'cE' })
    const moves = generateSangMoves(board, at(1, 1))
    expect(has(moves, 3, 4)).toBe(true)
    expect(has(moves, 4, 3)).toBe(true)
    expect(moves).toHaveLength(2)
  })
})
