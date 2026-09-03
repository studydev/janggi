import { describe, expect, it } from 'vitest'
import { generateJolMoves } from './jol'
import { at, has, scene } from '../testkit'

describe('generateJolMoves (졸·병)', () => {
  it('초 졸은 앞(rank 감소)·좌·우 3방향, 뒤로는 불가', () => {
    const board = scene({ '5,5': 'cJ' })
    const moves = generateJolMoves(board, at(5, 5))
    expect([...moves.map((m) => `${m.file},${m.rank}`)].sort()).toEqual(['4,5', '5,4', '6,5'])
    expect(has(moves, 5, 6)).toBe(false) // 뒤
  })

  it('한 병은 앞(rank 증가)·좌·우 3방향', () => {
    const board = scene({ '5,5': 'hJ' })
    const moves = generateJolMoves(board, at(5, 5))
    expect([...moves.map((m) => `${m.file},${m.rank}`)].sort()).toEqual(['4,5', '5,6', '6,5'])
    expect(has(moves, 5, 4)).toBe(false)
  })

  it('상대 궁성 중앙에서는 대각 전진 2개가 추가된다', () => {
    const board = scene({ '5,2': 'cJ' }) // 초 졸이 한 궁성 중앙
    const moves = generateJolMoves(board, at(5, 2))
    expect(has(moves, 4, 1)).toBe(true)
    expect(has(moves, 6, 1)).toBe(true)
    expect(has(moves, 5, 1)).toBe(true)
    expect(moves).toHaveLength(5)
  })

  it('상대 궁성 귀퉁이에서는 중앙으로 향하는 대각 전진만', () => {
    const board = scene({ '4,3': 'cJ' })
    const moves = generateJolMoves(board, at(4, 3))
    expect(has(moves, 5, 2)).toBe(true) // 대각 전진 (궁성 대각선)
    expect(has(moves, 3, 2)).toBe(false) // 대각선 밖
    expect(has(moves, 4, 2)).toBe(true) // 직진
    expect(has(moves, 3, 3)).toBe(true) // 옆
  })

  it('자기 궁성 대각선에서는 대각 이동이 없다', () => {
    const board = scene({ '5,9': 'cJ' })
    const moves = generateJolMoves(board, at(5, 9))
    expect(has(moves, 4, 8)).toBe(false)
    expect(has(moves, 6, 8)).toBe(false)
    expect(moves).toHaveLength(3)
  })

  it('아군은 막고 적은 잡는다', () => {
    const board = scene({ '5,5': 'cJ', '5,4': 'hR', '4,5': 'cM' })
    const moves = generateJolMoves(board, at(5, 5))
    expect(has(moves, 5, 4)).toBe(true)
    expect(has(moves, 4, 5)).toBe(false)
  })

  it('보드 가장자리에서 밖으로는 못 간다', () => {
    const board = scene({ '1,1': 'cJ' })
    expect(generateJolMoves(board, at(1, 1))).toHaveLength(1) // (2,1) 만
  })
})
