import { describe, expect, it } from 'vitest'
import { hasPosition, makeTestBoard } from '../test-utils'
import { generateSangMoves } from './sang'

describe('Sang moves', () => {
  it('has eight moves when every route is open', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([{ position, type: 'SANG', side: 'CHO' }])

    expect(generateSangMoves(board, position)).toHaveLength(8)
  })

  it('blocks both branches when the first straight point is occupied', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'SANG', side: 'CHO' },
      { position: { file: 5, rank: 4 }, type: 'JOL', side: 'HAN' },
    ])
    const moves = generateSangMoves(board, position)

    expect(moves).toHaveLength(6)
    expect(hasPosition(moves, { file: 3, rank: 2 })).toBe(false)
    expect(hasPosition(moves, { file: 7, rank: 2 })).toBe(false)
  })

  it('blocks one branch when its second path point is occupied', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'SANG', side: 'CHO' },
      { position: { file: 4, rank: 3 }, type: 'JOL', side: 'HAN' },
    ])
    const moves = generateSangMoves(board, position)

    expect(moves).toHaveLength(7)
    expect(hasPosition(moves, { file: 3, rank: 2 })).toBe(false)
    expect(hasPosition(moves, { file: 7, rank: 2 })).toBe(true)
  })

  it('cannot land on a friendly piece', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'SANG', side: 'CHO' },
      { position: { file: 3, rank: 2 }, type: 'JOL', side: 'CHO' },
    ])

    expect(hasPosition(generateSangMoves(board, position), { file: 3, rank: 2 })).toBe(false)
  })

  it('can capture an enemy at the destination', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'SANG', side: 'CHO' },
      { position: { file: 3, rank: 2 }, type: 'JOL', side: 'HAN' },
    ])

    expect(hasPosition(generateSangMoves(board, position), { file: 3, rank: 2 })).toBe(true)
  })
})