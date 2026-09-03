import { describe, expect, it } from 'vitest'
import {
  CELLS,
  createInitialBoard,
  createInitialState,
  fromIndex,
  isInPalace,
  isOnPalaceDiagonal,
  isPalaceDiagonalStep,
  palaceDiagonalDirs,
  pieceAt,
  toIndex,
} from './board'
import { at } from './testkit'

describe('coordinates', () => {
  it('toIndex / fromIndex round-trip for all cells', () => {
    for (let i = 0; i < CELLS; i += 1) {
      expect(toIndex(fromIndex(i))).toBe(i)
    }
  })

  it('index layout: (1,1) = 0, (9,1) = 8, (1,2) = 9, (9,10) = 89', () => {
    expect(toIndex(at(1, 1))).toBe(0)
    expect(toIndex(at(9, 1))).toBe(8)
    expect(toIndex(at(1, 2))).toBe(9)
    expect(toIndex(at(9, 10))).toBe(89)
  })

  it('off-board positions throw', () => {
    expect(() => toIndex(at(0, 1))).toThrow()
    expect(() => toIndex(at(10, 1))).toThrow()
    expect(() => toIndex(at(1, 11))).toThrow()
  })
})

describe('palace helpers', () => {
  it('isInPalace bounds', () => {
    expect(isInPalace(at(4, 1), 'HAN')).toBe(true)
    expect(isInPalace(at(6, 3), 'HAN')).toBe(true)
    expect(isInPalace(at(4, 4), 'HAN')).toBe(false)
    expect(isInPalace(at(5, 9), 'CHO')).toBe(true)
    expect(isInPalace(at(5, 9), 'HAN')).toBe(false)
  })

  it('isOnPalaceDiagonal only the 5 diagonal points per palace', () => {
    for (const p of [at(5, 2), at(4, 1), at(6, 1), at(4, 3), at(6, 3)]) {
      expect(isOnPalaceDiagonal(p)).toBe(true)
    }
    for (const p of [at(5, 1), at(4, 2), at(6, 2), at(5, 3)]) {
      expect(isOnPalaceDiagonal(p)).toBe(false)
    }
  })

  it('isPalaceDiagonalStep is exactly center <-> corner', () => {
    expect(isPalaceDiagonalStep(at(4, 1), at(5, 2))).toBe(true)
    expect(isPalaceDiagonalStep(at(5, 2), at(6, 3))).toBe(true)
    expect(isPalaceDiagonalStep(at(4, 1), at(4, 3))).toBe(false)
    expect(isPalaceDiagonalStep(at(5, 2), at(5, 3))).toBe(false)
  })

  it('palaceDiagonalDirs: 4 from center, 1 from a corner', () => {
    expect(palaceDiagonalDirs(at(5, 2))).toHaveLength(4)
    expect(palaceDiagonalDirs(at(4, 1))).toHaveLength(1)
    expect(palaceDiagonalDirs(at(5, 1))).toHaveLength(0)
  })
})

describe('createInitialBoard', () => {
  const board = createInitialBoard('MSMS', 'MSMS')

  it('한(漢) 뒷줄 (rank 1)', () => {
    expect(pieceAt(board, at(1, 1))).toEqual({ side: 'HAN', type: 'CHA' })
    expect(pieceAt(board, at(2, 1))).toEqual({ side: 'HAN', type: 'MA' })
    expect(pieceAt(board, at(3, 1))).toEqual({ side: 'HAN', type: 'SANG' })
    expect(pieceAt(board, at(4, 1))).toEqual({ side: 'HAN', type: 'SA' })
    expect(pieceAt(board, at(5, 1))).toBeNull()
    expect(pieceAt(board, at(6, 1))).toEqual({ side: 'HAN', type: 'SA' })
    expect(pieceAt(board, at(9, 1))).toEqual({ side: 'HAN', type: 'CHA' })
  })

  it('궁·포·병 위치', () => {
    expect(pieceAt(board, at(5, 2))).toEqual({ side: 'HAN', type: 'GUNG' })
    expect(pieceAt(board, at(2, 3))).toEqual({ side: 'HAN', type: 'PO' })
    expect(pieceAt(board, at(8, 3))).toEqual({ side: 'HAN', type: 'PO' })
    for (const f of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, at(f, 4))).toEqual({ side: 'HAN', type: 'JOL' })
    }
  })

  it('초(楚)는 rank 7~10 에 상하 대칭 배치', () => {
    expect(pieceAt(board, at(1, 10))).toEqual({ side: 'CHO', type: 'CHA' })
    expect(pieceAt(board, at(5, 9))).toEqual({ side: 'CHO', type: 'GUNG' })
    expect(pieceAt(board, at(2, 8))).toEqual({ side: 'CHO', type: 'PO' })
    for (const f of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, at(f, 7))).toEqual({ side: 'CHO', type: 'JOL' })
    }
  })

  it('총 32개 기물 (각 16)', () => {
    const all = board.filter((c) => c !== null)
    expect(all).toHaveLength(32)
    expect(all.filter((p) => p!.side === 'HAN')).toHaveLength(16)
    expect(all.filter((p) => p!.side === 'CHO')).toHaveLength(16)
  })

  it('마·상 배치 옵션이 file 2·3·7·8 에 반영된다', () => {
    const b = createInitialBoard('SMMS', 'MSSM')
    expect(pieceAt(b, at(2, 1))).toEqual({ side: 'HAN', type: 'SANG' })
    expect(pieceAt(b, at(3, 1))).toEqual({ side: 'HAN', type: 'MA' })
    expect(pieceAt(b, at(7, 1))).toEqual({ side: 'HAN', type: 'MA' })
    expect(pieceAt(b, at(8, 1))).toEqual({ side: 'HAN', type: 'SANG' })
    expect(pieceAt(b, at(2, 10))).toEqual({ side: 'CHO', type: 'MA' })
    expect(pieceAt(b, at(3, 10))).toEqual({ side: 'CHO', type: 'SANG' })
    expect(pieceAt(b, at(8, 10))).toEqual({ side: 'CHO', type: 'MA' })
  })
})

describe('createInitialState', () => {
  it('초(楚)가 선수', () => {
    expect(createInitialState().turn).toBe('CHO')
  })
})
