import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard, createInitialBoard, createInitialState, debugPrint, forwardDir,
  getPiece, hashPosition, indexToPosition, isInBoard, isInPalace,
  isOnPalaceDiagonal, positionToIndex, setPiece,
} from './board'

describe('board coordinates', () => {
  it('round trips all 90 intersections', () => {
    for (let index = 0; index < 90; index += 1) {
      expect(positionToIndex(indexToPosition(index))).toBe(index)
    }
    for (const index of [-1, 90, 1.5, NaN]) expect(() => indexToPosition(index)).toThrow()
    for (const position of [{ file: 0, rank: 1 }, { file: 1, rank: 11 }, { file: 1.5, rank: 2 }]) {
      expect(isInBoard(position)).toBe(false)
      expect(() => positionToIndex(position)).toThrow()
    }
  })

  it('recognizes palaces, diagonals and forward directions', () => {
    expect(isInPalace({ file: 4, rank: 1 }, 'HAN')).toBe(true)
    expect(isInPalace({ file: 6, rank: 10 }, 'CHO')).toBe(true)
    expect(isInPalace({ file: 4, rank: 4 }, 'HAN')).toBe(false)
    expect(isOnPalaceDiagonal({ file: 5, rank: 2 })).toBe(true)
    expect(isOnPalaceDiagonal({ file: 5, rank: 1 })).toBe(false)
    expect(forwardDir('HAN')).toBe(1)
    expect(forwardDir('CHO')).toBe(-1)
  })
})

describe('initial board', () => {
  it.each([
    ['MSMS', ['MA', 'SANG', 'MA', 'SANG']],
    ['SMSM', ['SANG', 'MA', 'SANG', 'MA']],
    ['MSSM', ['MA', 'SANG', 'SANG', 'MA']],
    ['SMMS', ['SANG', 'MA', 'MA', 'SANG']],
  ] as const)('places the %s arrangement for both sides', (setup, expected) => {
    const board = createInitialBoard(setup, setup)
    expect(board).toHaveLength(90)
    expect(board.filter((piece) => piece?.side === 'HAN')).toHaveLength(16)
    expect(board.filter((piece) => piece?.side === 'CHO')).toHaveLength(16)
    for (const rank of [1, 10]) {
      expect([2, 3, 7, 8].map((file) => getPiece(board, { file, rank })?.type)).toEqual(expected)
    }
    expect(getPiece(board, { file: 5, rank: 2 })?.type).toBe('GUNG')
    expect(getPiece(board, { file: 5, rank: 9 })?.side).toBe('CHO')
  })

  it('starts with Cho and records board plus turn', () => {
    const state = createInitialState()
    expect(state.turn).toBe('CHO')
    expect(state.positionHistory).toEqual([hashPosition(state.board, state.turn)])
    expect(hashPosition(state.board, 'HAN')).not.toBe(state.positionHistory[0])
    expect(debugPrint(state).split('\n')).toHaveLength(11)
  })

  it('changes a board without mutating its input', () => {
    const board = createEmptyBoard()
    const next = setPiece(board, { file: 5, rank: 5 }, { id: 'test', type: 'CHA', side: 'CHO' })
    expect(board.every((piece) => piece === null)).toBe(true)
    expect(getPiece(next, { file: 5, rank: 5 })?.type).toBe('CHA')
  })

  it('rejects invalid repetition counts', () => {
    for (const repetitionCount of [0, 1, 2.5, NaN]) {
      expect(() => createInitialState('MSMS', 'MSMS', { repetitionCount })).toThrow()
    }
  })
})