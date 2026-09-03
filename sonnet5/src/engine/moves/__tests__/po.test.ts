import { describe, expect, it } from 'vitest'
import { hasPos, pos, withPieces } from '../../testUtils'
import { generatePoMoves } from '../po'

describe('generatePoMoves', () => {
  it('포대(스크린)를 하나 넘으면 그 뒤 빈 칸들로 이동할 수 있다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'PO', side: 'HAN' }],
      [pos(5, 8), { type: 'JOL', side: 'HAN' }], // 스크린
    ])
    const moves = generatePoMoves(board, p)
    expect(hasPos(moves, pos(5, 6))).toBe(false) // 스크린 이전은 착지 불가
    expect(hasPos(moves, pos(5, 7))).toBe(false)
    expect(hasPos(moves, pos(5, 8))).toBe(false) // 스크린 자신에는 착지 불가
    expect(hasPos(moves, pos(5, 9))).toBe(true)
    expect(hasPos(moves, pos(5, 10))).toBe(true)
  })

  it('포를 넘으려 시도하면 그 방향으로 이동할 수 없다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'PO', side: 'HAN' }],
      [pos(5, 7), { type: 'PO', side: 'CHO' }], // 첫 기물이 포
      [pos(5, 9), { type: 'JOL', side: 'CHO' }],
    ])
    const moves = generatePoMoves(board, p)
    const downwardMoves = moves.filter((m) => m.file === 5 && m.rank > 5)
    expect(downwardMoves).toHaveLength(0)
  })

  it('포를 잡으려 시도하면 그 수는 생성되지 않는다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'PO', side: 'HAN' }],
      [pos(5, 7), { type: 'JOL', side: 'HAN' }], // 유효한 스크린
      [pos(5, 9), { type: 'PO', side: 'CHO' }], // 넘어선 곳의 적 포
    ])
    const moves = generatePoMoves(board, p)
    expect(hasPos(moves, pos(5, 8))).toBe(true) // 스크린 이후 빈 칸
    expect(hasPos(moves, pos(5, 9))).toBe(false) // 포는 잡을 수 없다
    expect(hasPos(moves, pos(5, 10))).toBe(false) // 그 이상도 못 감
  })

  it('스크린 뒤에 기물이 2개면 두 번째 기물을 넘어갈 수 없다', () => {
    const p = pos(5, 5)
    const board = withPieces([
      [p, { type: 'PO', side: 'HAN' }],
      [pos(5, 7), { type: 'JOL', side: 'HAN' }], // 스크린
      [pos(5, 8), { type: 'JOL', side: 'CHO' }], // 스크린 바로 뒤의 두 번째 기물
    ])
    const moves = generatePoMoves(board, p)
    expect(hasPos(moves, pos(5, 8))).toBe(true) // 스크린 뒤 첫 적은 잡을 수 있음
    expect(hasPos(moves, pos(5, 9))).toBe(false) // 그 너머는 불가(기물 2개를 넘을 수 없음)
    expect(hasPos(moves, pos(5, 10))).toBe(false)
  })

  it('궁성 귀퉁이에서 중앙에 포대가 있으면 반대 귀퉁이로 넘어갈 수 있다', () => {
    const p = pos(4, 1)
    const board = withPieces([
      [p, { type: 'PO', side: 'HAN' }],
      [pos(5, 2), { type: 'SA', side: 'HAN' }], // 중앙 스크린
    ])
    const moves = generatePoMoves(board, p)
    expect(hasPos(moves, pos(5, 2))).toBe(false) // 스크린 자체엔 착지 불가
    expect(hasPos(moves, pos(6, 3))).toBe(true)
  })

  it('궁성 중앙에서는 대각선 경로 길이가 1이라 스크린을 놓을 자리가 없어 대각 이동이 불가하다', () => {
    const p = pos(5, 2)
    const board = withPieces([[p, { type: 'PO', side: 'HAN' }]])
    const moves = generatePoMoves(board, p)
    expect(moves).toHaveLength(0)
  })
})
