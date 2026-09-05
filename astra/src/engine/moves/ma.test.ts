import { describe, expect, it } from 'vitest'
import { hasPosition, makeBoard } from '../test-utils'
import { generateMaMoves } from './ma'

describe('Ma', () => {
  const from = { file: 5, rank: 5 }
  it('has eight 1-straight plus 1-diagonal moves', () => {
    const moves = generateMaMoves(makeBoard([5, 5, 'MA']), from)
    expect(moves).toHaveLength(8)
    expect(hasPosition(moves, 6, 3)).toBe(true)
    expect(hasPosition(moves, 7, 4)).toBe(true)
  })
  it.each([[5, 4], [5, 6], [4, 5], [6, 5]])('loses two moves when the leg at %s,%s is blocked', (file, rank) => {
    expect(generateMaMoves(makeBoard([5, 5, 'MA'], [file, rank, 'JOL']), from)).toHaveLength(6)
  })
  it('captures enemies but never friendly pieces', () => {
    const moves = generateMaMoves(makeBoard([5, 5, 'MA'], [6, 3, 'CHA', 'HAN'], [4, 3, 'JOL']), from)
    expect(hasPosition(moves, 6, 3)).toBe(true)
    expect(hasPosition(moves, 4, 3)).toBe(false)
  })
  it('stays within the board', () => {
    expect(generateMaMoves(makeBoard([1, 1, 'MA']), { file: 1, rank: 1 })).toHaveLength(2)
  })
})