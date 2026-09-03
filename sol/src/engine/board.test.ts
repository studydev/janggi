import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  createInitialBoard,
  forwardDir,
  getPiece,
  indexToPosition,
  isInBoard,
  isInPalace,
  isOnPalaceDiagonal,
  positionToIndex,
} from './board'

describe('board coordinates', () => {
  it('converts every board position to an index and back', () => {
    for (let rank = 1; rank <= 10; rank += 1) {
      for (let file = 1; file <= 9; file += 1) {
        const position = { file, rank }
        expect(indexToPosition(positionToIndex(position))).toEqual(position)
      }
    }
  })

  it('recognizes board and palace boundaries', () => {
    expect(isInBoard({ file: 1, rank: 1 })).toBe(true)
    expect(isInBoard({ file: 10, rank: 1 })).toBe(false)
    expect(isInPalace({ file: 4, rank: 1 }, 'HAN')).toBe(true)
    expect(isInPalace({ file: 4, rank: 4 }, 'HAN')).toBe(false)
    expect(isInPalace({ file: 6, rank: 10 }, 'CHO')).toBe(true)
    expect(isOnPalaceDiagonal({ file: 5, rank: 2 })).toBe(true)
    expect(isOnPalaceDiagonal({ file: 5, rank: 1 })).toBe(false)
  })

  it('uses opposite forward directions for Han and Cho', () => {
    expect(forwardDir('HAN')).toBe(1)
    expect(forwardDir('CHO')).toBe(-1)
  })
})

describe('initial board', () => {
  it('creates an empty 90-point board', () => {
    expect(createEmptyBoard()).toHaveLength(90)
    expect(createEmptyBoard().every((piece) => piece === null)).toBe(true)
  })

  it('places all pieces using each side setup', () => {
    const board = createInitialBoard('MSSM', 'SMMS')

    expect(board.filter((piece) => piece?.side === 'HAN')).toHaveLength(16)
    expect(board.filter((piece) => piece?.side === 'CHO')).toHaveLength(16)
    expect(getPiece(board, { file: 5, rank: 2 })?.type).toBe('GUNG')
    expect(getPiece(board, { file: 5, rank: 9 })?.side).toBe('CHO')

    expect([2, 3, 7, 8].map((file) => getPiece(board, { file, rank: 1 })?.type)).toEqual([
      'MA',
      'SANG',
      'SANG',
      'MA',
    ])
    expect([2, 3, 7, 8].map((file) => getPiece(board, { file, rank: 10 })?.type)).toEqual([
      'SANG',
      'MA',
      'MA',
      'SANG',
    ])
  })
})