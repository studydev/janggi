import { describe, expect, it } from 'vitest'
import { isInPalace } from '../board'
import { makeBoard } from '../test-utils'
import { generateGungMoves } from './gung'
import { generateSaMoves } from './sa'

describe.each([
  ['GUNG', generateGungMoves], ['SA', generateSaMoves],
] as const)('%s palace movement', (type, generate) => {
  it.each(['HAN', 'CHO'] as const)('uses eight lines at the %s center', (side) => {
    const position = { file: 5, rank: side === 'HAN' ? 2 : 9 }
    const moves = generate(makeBoard([position.file, position.rank, type, side]), position)
    expect(moves).toHaveLength(8)
    expect(moves.every((target) => isInPalace(target, side))).toBe(true)
  })
  it.each(['HAN', 'CHO'] as const)('stays in the %s palace at a corner', (side) => {
    const position = { file: 4, rank: side === 'HAN' ? 1 : 10 }
    const moves = generate(makeBoard([position.file, position.rank, type, side]), position)
    expect(moves).toHaveLength(3)
    expect(moves.every((target) => isInPalace(target, side))).toBe(true)
  })
  it('has no diagonal at the middle of a palace edge', () => {
    expect(generate(makeBoard([5, 1, type, 'HAN']), { file: 5, rank: 1 })).toHaveLength(3)
  })
  it('cannot occupy or move within the other palace', () => {
    expect(generate(makeBoard([5, 2, type, 'CHO']), { file: 5, rank: 2 })).toEqual([])
  })
  it('does not land on a friendly piece', () => {
    const moves = generate(makeBoard([5, 9, type], [4, 8, 'JOL']), { file: 5, rank: 9 })
    expect(moves).toHaveLength(7)
  })
})