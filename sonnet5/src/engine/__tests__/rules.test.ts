import { describe, expect, it } from 'vitest'
import { pieceAt } from '../board'
import { canPass, generateLegalMoves, getLegalMovesFrom, isAttacked, isCheck, makeMove, pass } from '../rules'
import { makeState, pos, withPieces } from '../testUtils'

describe('isAttacked / isCheck', () => {
  it('차가 궁을 직선으로 노리면 장군이다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 5), { type: 'CHA', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    expect(isCheck(state, 'HAN')).toBe(true)
    expect(isAttacked(board, pos(5, 2), 'CHO')).toBe(true)
  })

  it('사이에 다른 기물이 있으면 장군이 아니다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 5), { type: 'CHA', side: 'CHO' }],
      [pos(5, 3), { type: 'SA', side: 'HAN' }], // 차단
    ])
    const state = makeState(board, 'HAN')
    expect(isCheck(state, 'HAN')).toBe(false)
  })
})

describe('generateLegalMoves', () => {
  it('자기 궁이 장군에 노출되는 수는 제외된다(핀)', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 3), { type: 'SA', side: 'HAN' }], // 차 공격을 막고 있는 사
      [pos(5, 5), { type: 'CHA', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    const saMoves = getLegalMovesFrom(state, pos(5, 3))
    expect(saMoves).toHaveLength(0) // (4,3), (6,3) 모두 핀 때문에 불가
  })

  it('막고 있던 기물이 옆으로 비켜도 궁이 안전하면 합법이다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 3), { type: 'SA', side: 'HAN' }],
      [pos(6, 6), { type: 'CHA', side: 'CHO' }], // 대각선상이라 file5를 노리지 않음
    ])
    const state = makeState(board, 'HAN')
    const saMoves = getLegalMovesFrom(state, pos(5, 3))
    expect(saMoves.length).toBeGreaterThan(0)
  })
})

describe('makeMove', () => {
  it('불변 업데이트: 원본 상태를 변경하지 않고 새 상태를 반환한다', () => {
    const board = withPieces([
      [pos(5, 5), { type: 'CHA', side: 'HAN' }],
      [pos(5, 8), { type: 'JOL', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    const before = structuredClone(state)
    const move = generateLegalMoves(state).find((m) => m.to.file === 5 && m.to.rank === 8)
    expect(move).toBeDefined()
    const next = makeMove(state, move!)

    expect(state).toEqual(before) // 원본 불변
    expect(next.turn).toBe('CHO')
    expect(pieceAt(next.board, pos(5, 5))).toBeNull() // 출발 지점은 비었다
    expect(pieceAt(next.board, pos(5, 8))).toEqual({ type: 'CHA', side: 'HAN' }) // 도착 지점으로 이동
    expect(next.capturedPieces.CHO).toHaveLength(1)
    expect(next.capturedPieces.CHO[0]).toEqual({ type: 'JOL', side: 'CHO' })
    expect(next.moveHistory).toHaveLength(1)
  })
})

describe('pass / canPass', () => {
  it('장군이 아니면 패스할 수 있다', () => {
    const board = withPieces([[pos(5, 2), { type: 'GUNG', side: 'HAN' }]])
    const state = makeState(board, 'HAN')
    expect(canPass(state)).toBe(true)
    const next = pass(state)
    expect(next.turn).toBe('CHO')
    expect(next.moveHistory).toHaveLength(1)
    expect(next.moveHistory[0].isPass).toBe(true)
  })

  it('장군 상태에서는 패스할 수 없다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 5), { type: 'CHA', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    expect(canPass(state)).toBe(false)
  })
})
