import { describe, expect, it } from 'vitest'
import {
  createInitialBoard,
  forwardDir,
  indexFromPosition,
  isInPalace,
  isOnPalaceDiagonal,
  positionFromIndex,
} from '../board'
import { BOARD_SIZE } from '../types'

describe('board coordinates', () => {
  it('round-trips every board index', () => {
    for (let index = 0; index < BOARD_SIZE; index += 1) {
      expect(indexFromPosition(positionFromIndex(index))).toBe(index)
    }
  })

  it('recognizes each palace and its five diagonal points', () => {
    expect(isInPalace({ file: 5, rank: 2 }, 'HAN')).toBe(true)
    expect(isInPalace({ file: 5, rank: 9 }, 'CHO')).toBe(true)
    expect(isInPalace({ file: 3, rank: 2 }, 'HAN')).toBe(false)
    expect(isOnPalaceDiagonal({ file: 4, rank: 1 })).toBe(true)
    expect(isOnPalaceDiagonal({ file: 5, rank: 2 })).toBe(true)
    expect(isOnPalaceDiagonal({ file: 5, rank: 1 })).toBe(false)
  })

  it('points Han and Cho toward one another', () => {
    expect(forwardDir('HAN')).toBe(1)
    expect(forwardDir('CHO')).toBe(-1)
  })
})

describe('initial position', () => {
  it('creates the Korean Janggi starting layout with Cho to move', () => {
    const board = createInitialBoard('MA-SANG-MA-SANG', 'SANG-MA-MA-SANG')
    expect(board).toHaveLength(BOARD_SIZE)
    expect(board.filter(Boolean)).toHaveLength(32)
    expect(board[indexFromPosition({ file: 1, rank: 1 })]?.type).toBe('CHA')
    expect(board[indexFromPosition({ file: 2, rank: 1 })]?.type).toBe('MA')
    expect(board[indexFromPosition({ file: 3, rank: 1 })]?.type).toBe('SANG')
    expect(board[indexFromPosition({ file: 2, rank: 10 })]?.type).toBe('SANG')
    expect(board[indexFromPosition({ file: 8, rank: 10 })]?.type).toBe('SANG')
    expect(board[indexFromPosition({ file: 5, rank: 2 })]?.type).toBe('GUNG')
    expect(board[indexFromPosition({ file: 5, rank: 9 })]?.side).toBe('CHO')
  })
})