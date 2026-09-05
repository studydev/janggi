import { describe, expect, it } from 'vitest'
import { hasPosition, makeBoard } from '../test-utils'
import { generatePoMoves } from './po'

describe('Po', () => {
  const from = { file: 1, rank: 5 }
  it('cannot move or capture without a screen', () => {
    expect(generatePoMoves(makeBoard([1, 5, 'PO']), from)).toEqual([])
    expect(generatePoMoves(makeBoard([1, 5, 'PO'], [6, 5, 'CHA', 'HAN']), from)).not.toContainEqual({ file: 6, rank: 5 })
  })
  it.each(['HAN', 'CHO'] as const)('jumps over a %s screen for both movement and capture', (side) => {
    const moves = generatePoMoves(makeBoard([1, 5, 'PO'], [3, 5, 'JOL', side], [6, 5, 'CHA', 'HAN']), from)
    expect(hasPosition(moves, 2, 5)).toBe(false)
    expect(hasPosition(moves, 4, 5)).toBe(true)
    expect(hasPosition(moves, 6, 5)).toBe(true)
    expect(hasPosition(moves, 7, 5)).toBe(false)
  })
  it.each(['HAN', 'CHO'] as const)('cannot jump over a %s Po', (side) => {
    expect(generatePoMoves(makeBoard([1, 5, 'PO'], [3, 5, 'PO', side]), from)).toEqual([])
  })
  it('cannot capture or pass an enemy Po', () => {
    const moves = generatePoMoves(makeBoard([1, 5, 'PO'], [3, 5, 'JOL'], [6, 5, 'PO', 'HAN']), from)
    expect(hasPosition(moves, 5, 5)).toBe(true)
    expect(hasPosition(moves, 6, 5)).toBe(false)
    expect(hasPosition(moves, 7, 5)).toBe(false)
  })
  it('cannot jump over two pieces', () => {
    const moves = generatePoMoves(makeBoard([1, 5, 'PO'], [3, 5, 'JOL'], [5, 5, 'SA'], [7, 5, 'CHA', 'HAN']), from)
    expect(hasPosition(moves, 4, 5)).toBe(true)
    expect(hasPosition(moves, 5, 5)).toBe(false)
    expect(hasPosition(moves, 7, 5)).toBe(false)
  })
  it('uses the palace center as a screen and stops at the opposite corner', () => {
    const moves = generatePoMoves(makeBoard([4, 1, 'PO'], [5, 2, 'SA']), { file: 4, rank: 1 })
    expect(hasPosition(moves, 5, 2)).toBe(false)
    expect(hasPosition(moves, 6, 3)).toBe(true)
    expect(hasPosition(moves, 7, 4)).toBe(false)
  })
  it('cannot use a palace-center Po as a screen', () => {
    const moves = generatePoMoves(makeBoard([4, 1, 'PO'], [5, 2, 'PO']), { file: 4, rank: 1 })
    expect(hasPosition(moves, 6, 3)).toBe(false)
  })
})