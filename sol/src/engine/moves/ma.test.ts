import { describe, expect, it } from 'vitest'
import { hasPosition, makeTestBoard } from '../test-utils'
import { generateMaMoves } from './ma'

describe('Ma moves', () => {
  it('has eight moves when all four legs are open', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([{ position, type: 'MA', side: 'CHO' }])

    expect(generateMaMoves(board, position)).toHaveLength(8)
  })

  it('loses both moves behind a blocked straight leg', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'MA', side: 'CHO' },
      { position: { file: 5, rank: 4 }, type: 'JOL', side: 'HAN' },
    ])
    const moves = generateMaMoves(board, position)

    expect(moves).toHaveLength(6)
    expect(hasPosition(moves, { file: 4, rank: 3 })).toBe(false)
    expect(hasPosition(moves, { file: 6, rank: 3 })).toBe(false)
  })

  it('cannot land on a friendly piece', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'MA', side: 'CHO' },
      { position: { file: 4, rank: 3 }, type: 'JOL', side: 'CHO' },
    ])

    expect(hasPosition(generateMaMoves(board, position), { file: 4, rank: 3 })).toBe(false)
  })

  it('can capture an enemy at the destination', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'MA', side: 'CHO' },
      { position: { file: 4, rank: 3 }, type: 'JOL', side: 'HAN' },
    ])

    expect(hasPosition(generateMaMoves(board, position), { file: 4, rank: 3 })).toBe(true)
  })
})