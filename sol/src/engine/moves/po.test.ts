import { describe, expect, it } from 'vitest'
import { hasPosition, makeTestBoard } from '../test-utils'
import { generatePoMoves } from './po'

describe('Po moves', () => {
  it('cannot move without a screen', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([{ position, type: 'PO', side: 'CHO' }])

    expect(generatePoMoves(board, position)).toEqual([])
  })

  it('moves and captures only after exactly one screen', () => {
    const position = { file: 1, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'PO', side: 'CHO' },
      { position: { file: 3, rank: 5 }, type: 'JOL', side: 'CHO' },
      { position: { file: 6, rank: 5 }, type: 'CHA', side: 'HAN' },
    ])
    const moves = generatePoMoves(board, position)

    expect(hasPosition(moves, { file: 2, rank: 5 })).toBe(false)
    expect(hasPosition(moves, { file: 4, rank: 5 })).toBe(true)
    expect(hasPosition(moves, { file: 6, rank: 5 })).toBe(true)
    expect(hasPosition(moves, { file: 7, rank: 5 })).toBe(false)
  })

  it('cannot use another Po as a screen', () => {
    const position = { file: 1, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'PO', side: 'CHO' },
      { position: { file: 3, rank: 5 }, type: 'PO', side: 'HAN' },
    ])

    expect(generatePoMoves(board, position)).toEqual([])
  })

  it('cannot capture another Po', () => {
    const position = { file: 1, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'PO', side: 'CHO' },
      { position: { file: 3, rank: 5 }, type: 'JOL', side: 'HAN' },
      { position: { file: 6, rank: 5 }, type: 'PO', side: 'HAN' },
    ])
    const moves = generatePoMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 5 })).toBe(true)
    expect(hasPosition(moves, { file: 6, rank: 5 })).toBe(false)
    expect(hasPosition(moves, { file: 7, rank: 5 })).toBe(false)
  })

  it('cannot pass a second intervening piece', () => {
    const position = { file: 1, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'PO', side: 'CHO' },
      { position: { file: 3, rank: 5 }, type: 'JOL', side: 'HAN' },
      { position: { file: 5, rank: 5 }, type: 'SA', side: 'CHO' },
      { position: { file: 7, rank: 5 }, type: 'CHA', side: 'HAN' },
    ])
    const moves = generatePoMoves(board, position)

    expect(hasPosition(moves, { file: 4, rank: 5 })).toBe(true)
    expect(hasPosition(moves, { file: 7, rank: 5 })).toBe(false)
  })

  it('crosses a palace diagonal only with the center as a screen', () => {
    const position = { file: 4, rank: 1 }
    const board = makeTestBoard([
      { position, type: 'PO', side: 'CHO' },
      { position: { file: 5, rank: 2 }, type: 'SA', side: 'HAN' },
    ])
    const moves = generatePoMoves(board, position)

    expect(hasPosition(moves, { file: 6, rank: 3 })).toBe(true)
    expect(hasPosition(moves, { file: 5, rank: 2 })).toBe(false)
  })
})