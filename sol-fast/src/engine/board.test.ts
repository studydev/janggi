import { describe, expect, it } from 'vitest'
import {
  BOARD_SIZE,
  createInitialBoard,
  createInitialState,
  forwardDir,
  getPiece,
  indexToPosition,
  isInPalace,
  isOnPalaceDiagonal,
  positionToIndex,
  toPosition,
} from './board'

describe('board coordinates', () => {
  it('round-trips all 90 intersections through the flat board', () => {
    for (let index = 0; index < BOARD_SIZE; index += 1) {
      expect(positionToIndex(indexToPosition(index))).toBe(index)
    }
  })

  it('recognizes board and palace boundaries', () => {
    expect(toPosition(0, 1)).toBeNull()
    expect(toPosition(9, 10)).toEqual({ file: 9, rank: 10 })
    expect(isInPalace({ file: 4, rank: 1 }, 'HAN')).toBe(true)
    expect(isInPalace({ file: 4, rank: 4 }, 'HAN')).toBe(false)
    expect(isOnPalaceDiagonal({ file: 5, rank: 2 })).toBe(true)
    expect(isOnPalaceDiagonal({ file: 4, rank: 2 })).toBe(false)
    expect(forwardDir('HAN')).toBe(1)
    expect(forwardDir('CHO')).toBe(-1)
  })
})

describe('initial position', () => {
  it('places 16 pieces per side and gives CHO the first turn', () => {
    const state = createInitialState()
    expect(state.board.filter((piece) => piece?.side === 'HAN')).toHaveLength(16)
    expect(state.board.filter((piece) => piece?.side === 'CHO')).toHaveLength(16)
    expect(state.turn).toBe('CHO')
  })

  it('applies each selected horse-elephant formation', () => {
    const board = createInitialBoard('SMMS', 'MSSM')
    expect(getPiece(board, { file: 2, rank: 1 })?.type).toBe('SANG')
    expect(getPiece(board, { file: 3, rank: 1 })?.type).toBe('MA')
    expect(getPiece(board, { file: 2, rank: 10 })?.type).toBe('MA')
    expect(getPiece(board, { file: 3, rank: 10 })?.type).toBe('SANG')
  })
})