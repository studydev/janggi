import { describe, expect, it } from 'vitest'
import { hasPosition, makeTestBoard } from '../test-utils'
import { generateChaMoves } from './cha'

describe('Cha moves', () => {
  it('moves along all open orthogonal lines', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([{ position, type: 'CHA', side: 'CHO' }])

    expect(generateChaMoves(board, position)).toHaveLength(17)
  })

  it('stops before a friendly piece', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 3 }, type: 'JOL', side: 'CHO' },
    ])
    const moves = generateChaMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 4 })).toBe(true)
    expect(hasPosition(moves, { file: 5, rank: 3 })).toBe(false)
    expect(hasPosition(moves, { file: 5, rank: 2 })).toBe(false)
  })

  it('includes an enemy and stops after capturing it', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 3 }, type: 'JOL', side: 'HAN' },
    ])
    const moves = generateChaMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 3 })).toBe(true)
    expect(hasPosition(moves, { file: 5, rank: 2 })).toBe(false)
  })

  it('crosses a palace diagonal from corner to opposite corner', () => {
    const position = { file: 4, rank: 1 }
    const board = makeTestBoard([{ position, type: 'CHA', side: 'CHO' }])
    const moves = generateChaMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 2 })).toBe(true)
    expect(hasPosition(moves, { file: 6, rank: 3 })).toBe(true)
    expect(moves).toHaveLength(19)
  })

  it('cannot continue through an occupied palace center', () => {
    const position = { file: 4, rank: 1 }
    const board = makeTestBoard([
      { position, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 2 }, type: 'SA', side: 'CHO' },
    ])
    const moves = generateChaMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 2 })).toBe(false)
    expect(hasPosition(moves, { file: 6, rank: 3 })).toBe(false)
  })
})