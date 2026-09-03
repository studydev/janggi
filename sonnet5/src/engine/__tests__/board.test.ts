import { describe, expect, it } from 'vitest'
import {
  createInitialBoard,
  createInitialGameState,
  forwardDir,
  getPalaceDiagonalRays,
  isInBoard,
  isInPalace,
  isOnPalaceDiagonal,
  opponent,
  pieceAt,
  positionKey,
  toIndex,
  toPosition,
} from '../board'
import { pos } from '../testUtils'

describe('좌표 변환', () => {
  it('toIndex/toPosition은 서로 역함수다', () => {
    for (let file = 1; file <= 9; file++) {
      for (let rank = 1; rank <= 10; rank++) {
        const p = { file, rank }
        expect(toPosition(toIndex(p))).toEqual(p)
      }
    }
  })

  it('isInBoard는 범위 밖 좌표를 걸러낸다', () => {
    expect(isInBoard(pos(1, 1))).toBe(true)
    expect(isInBoard(pos(9, 10))).toBe(true)
    expect(isInBoard(pos(0, 5))).toBe(false)
    expect(isInBoard(pos(10, 5))).toBe(false)
    expect(isInBoard(pos(5, 0))).toBe(false)
    expect(isInBoard(pos(5, 11))).toBe(false)
  })
})

describe('궁성/대각선 판정', () => {
  it('isInPalace: file 4~6 & 각 진영의 rank 범위만 궁성이다', () => {
    expect(isInPalace(pos(5, 2), 'HAN')).toBe(true)
    expect(isInPalace(pos(5, 4), 'HAN')).toBe(false)
    expect(isInPalace(pos(3, 2))).toBe(false)
    expect(isInPalace(pos(5, 9), 'CHO')).toBe(true)
  })

  it('getPalaceDiagonalRays: 귀퉁이는 중앙→반대 귀퉁이 경로 1개를 반환한다', () => {
    const rays = getPalaceDiagonalRays(pos(4, 1))
    expect(rays).toHaveLength(1)
    expect(rays[0]).toEqual([pos(5, 2), pos(6, 3)])
  })

  it('getPalaceDiagonalRays: 중앙은 귀퉁이 4개로 가는 경로 4개를 반환한다', () => {
    const rays = getPalaceDiagonalRays(pos(5, 2))
    expect(rays).toHaveLength(4)
  })

  it('궁성 변 중앙 등 대각선 위가 아닌 점은 빈 배열을 반환한다', () => {
    expect(getPalaceDiagonalRays(pos(5, 1))).toHaveLength(0)
    expect(isOnPalaceDiagonal(pos(5, 1))).toBe(false)
    expect(isOnPalaceDiagonal(pos(4, 1))).toBe(true)
  })
})

describe('forwardDir/opponent', () => {
  it('HAN은 +1(아래로), CHO는 -1(위로) 전진한다', () => {
    expect(forwardDir('HAN')).toBe(1)
    expect(forwardDir('CHO')).toBe(-1)
  })

  it('opponent는 상대 진영을 반환한다', () => {
    expect(opponent('HAN')).toBe('CHO')
    expect(opponent('CHO')).toBe('HAN')
  })
})

describe('createInitialBoard', () => {
  it('RULES.md의 초기 배치를 정확히 재현한다 (마상마상 조합)', () => {
    const board = createInitialBoard('MSMS', 'MSMS')

    // 한(위쪽)
    expect(pieceAt(board, pos(1, 1))).toEqual({ type: 'CHA', side: 'HAN' })
    expect(pieceAt(board, pos(9, 1))).toEqual({ type: 'CHA', side: 'HAN' })
    expect(pieceAt(board, pos(2, 1))).toEqual({ type: 'MA', side: 'HAN' })
    expect(pieceAt(board, pos(3, 1))).toEqual({ type: 'SANG', side: 'HAN' })
    expect(pieceAt(board, pos(7, 1))).toEqual({ type: 'MA', side: 'HAN' })
    expect(pieceAt(board, pos(8, 1))).toEqual({ type: 'SANG', side: 'HAN' })
    expect(pieceAt(board, pos(4, 1))).toEqual({ type: 'SA', side: 'HAN' })
    expect(pieceAt(board, pos(6, 1))).toEqual({ type: 'SA', side: 'HAN' })
    expect(pieceAt(board, pos(5, 1))).toBeNull()
    expect(pieceAt(board, pos(5, 2))).toEqual({ type: 'GUNG', side: 'HAN' })
    expect(pieceAt(board, pos(2, 3))).toEqual({ type: 'PO', side: 'HAN' })
    expect(pieceAt(board, pos(8, 3))).toEqual({ type: 'PO', side: 'HAN' })
    for (const file of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, pos(file, 4))).toEqual({ type: 'JOL', side: 'HAN' })
    }

    // 초(아래쪽, 상하 대칭)
    expect(pieceAt(board, pos(1, 10))).toEqual({ type: 'CHA', side: 'CHO' })
    expect(pieceAt(board, pos(9, 10))).toEqual({ type: 'CHA', side: 'CHO' })
    expect(pieceAt(board, pos(4, 10))).toEqual({ type: 'SA', side: 'CHO' })
    expect(pieceAt(board, pos(6, 10))).toEqual({ type: 'SA', side: 'CHO' })
    expect(pieceAt(board, pos(5, 9))).toEqual({ type: 'GUNG', side: 'CHO' })
    expect(pieceAt(board, pos(2, 8))).toEqual({ type: 'PO', side: 'CHO' })
    expect(pieceAt(board, pos(8, 8))).toEqual({ type: 'PO', side: 'CHO' })
    for (const file of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, pos(file, 7))).toEqual({ type: 'JOL', side: 'CHO' })
    }
  })

  it('상마상마 조합은 좌우가 반대로 배치된다', () => {
    const board = createInitialBoard('SMSM', 'MSMS')
    expect(pieceAt(board, pos(2, 1))).toEqual({ type: 'SANG', side: 'HAN' })
    expect(pieceAt(board, pos(3, 1))).toEqual({ type: 'MA', side: 'HAN' })
    expect(pieceAt(board, pos(7, 1))).toEqual({ type: 'SANG', side: 'HAN' })
    expect(pieceAt(board, pos(8, 1))).toEqual({ type: 'MA', side: 'HAN' })
  })

  it('마상상마 조합은 좌측만 마상, 우측은 상마다', () => {
    const board = createInitialBoard('MSSM', 'MSMS')
    expect(pieceAt(board, pos(2, 1))).toEqual({ type: 'MA', side: 'HAN' })
    expect(pieceAt(board, pos(3, 1))).toEqual({ type: 'SANG', side: 'HAN' })
    expect(pieceAt(board, pos(7, 1))).toEqual({ type: 'SANG', side: 'HAN' })
    expect(pieceAt(board, pos(8, 1))).toEqual({ type: 'MA', side: 'HAN' })
  })
})

describe('createInitialGameState', () => {
  it('초(楚)가 선수다', () => {
    const state = createInitialGameState('MSMS', 'MSMS')
    expect(state.turn).toBe('CHO')
  })

  it('초기 국면의 positionCounts가 1로 초기화된다', () => {
    const state = createInitialGameState('MSMS', 'MSMS')
    const key = positionKey(state.board, state.turn)
    expect(state.positionCounts[key]).toBe(1)
  })
})
