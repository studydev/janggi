import { describe, expect, it } from 'vitest'
import { generateMaMoves } from './ma'
import { at, has, scene } from '../testkit'

describe('generateMaMoves (마)', () => {
  it('빈 보드 중앙에서 8방향', () => {
    const board = scene({ '5,5': 'cM' })
    expect(generateMaMoves(board, at(5, 5))).toHaveLength(8)
  })

  it('다리(첫 직선 칸)가 막히면 그 두 목적지는 사라진다', () => {
    const board = scene({ '5,5': 'cM', '5,4': 'hJ' }) // 위쪽 다리 막힘
    const moves = generateMaMoves(board, at(5, 5))
    expect(has(moves, 4, 3)).toBe(false)
    expect(has(moves, 6, 3)).toBe(false)
    // 다른 방향은 그대로.
    expect(has(moves, 4, 7)).toBe(true)
    expect(has(moves, 6, 7)).toBe(true)
    expect(moves).toHaveLength(6)
  })

  it('다리가 비어 있으면 그 칸의 기물 색과 무관하게 통과 판정은 점유 여부만 본다', () => {
    // 다리 칸이 적이어도 "점유"이므로 막힌다.
    const board = scene({ '5,5': 'cM', '4,5': 'hJ' }) // 왼쪽 다리 막힘
    const moves = generateMaMoves(board, at(5, 5))
    expect(has(moves, 3, 4)).toBe(false)
    expect(has(moves, 3, 6)).toBe(false)
  })

  it('목적지의 적은 잡고 아군은 막는다', () => {
    const board = scene({ '5,5': 'cM', '6,3': 'hR', '4,3': 'cS' })
    const moves = generateMaMoves(board, at(5, 5))
    expect(has(moves, 6, 3)).toBe(true) // 적 车 포획
    expect(has(moves, 4, 3)).toBe(false) // 아군 士
  })

  it('구석에서는 보드 밖 목적지가 잘린다', () => {
    const board = scene({ '1,1': 'cM' })
    const moves = generateMaMoves(board, at(1, 1))
    expect(has(moves, 2, 3)).toBe(true)
    expect(has(moves, 3, 2)).toBe(true)
    expect(moves).toHaveLength(2)
  })
})
