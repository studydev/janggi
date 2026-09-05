import { describe, expect, it } from 'vitest'
import { hasPosition, makeTestBoard } from '../test-utils'
import { generateGungMoves } from './gung'
import { generateSaMoves } from './sa'

describe('Gung moves', () => {
  it('moves in all eight connected directions from palace center', () => {
    const position = { file: 5, rank: 2 }
    const board = makeTestBoard([{ position, type: 'GUNG', side: 'HAN' }])

    expect(generateGungMoves(board, position)).toHaveLength(8)
  })

  it('does not move diagonally where no palace diagonal is drawn', () => {
    const position = { file: 5, rank: 1 }
    const board = makeTestBoard([{ position, type: 'GUNG', side: 'HAN' }])
    const moves = generateGungMoves(board, position)

    expect(moves).toHaveLength(3)
    expect(hasPosition(moves, { file: 4, rank: 2 })).toBe(false)
  })

  it('uses the drawn diagonal from a corner to center', () => {
    const position = { file: 4, rank: 1 }
    const board = makeTestBoard([{ position, type: 'GUNG', side: 'HAN' }])

    expect(hasPosition(generateGungMoves(board, position), { file: 5, rank: 2 })).toBe(true)
  })

  it('never leaves its own palace', () => {
    const position = { file: 4, rank: 2 }
    const board = makeTestBoard([{ position, type: 'GUNG', side: 'HAN' }])

    expect(hasPosition(generateGungMoves(board, position), { file: 3, rank: 2 })).toBe(false)
  })
})

describe('Sa moves', () => {
  it('shares palace movement and respects occupied destinations', () => {
    const position = { file: 4, rank: 10 }
    const board = makeTestBoard([
      { position, type: 'SA', side: 'CHO' },
      { position: { file: 5, rank: 10 }, type: 'GUNG', side: 'CHO' },
      { position: { file: 5, rank: 9 }, type: 'JOL', side: 'HAN' },
    ])
    const moves = generateSaMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 10 })).toBe(false)
    expect(hasPosition(moves, { file: 5, rank: 9 })).toBe(true)
    expect(moves.every((move) => move.file >= 4 && move.file <= 6 && move.rank >= 8)).toBe(true)
  })
})