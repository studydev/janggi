import { describe, expect, it } from 'vitest'
import { hasPosition, makeTestBoard } from '../test-utils'
import { generateJolMoves } from './jol'

describe('Jol and Byeong moves', () => {
  it('lets Cho move forward or sideways from the beginning, never backward', () => {
    const position = { file: 5, rank: 7 }
    const board = makeTestBoard([{ position, type: 'JOL', side: 'CHO' }])
    const moves = generateJolMoves(board, position)

    expect(moves).toHaveLength(3)
    expect(hasPosition(moves, { file: 5, rank: 6 })).toBe(true)
    expect(hasPosition(moves, { file: 4, rank: 7 })).toBe(true)
    expect(hasPosition(moves, { file: 6, rank: 7 })).toBe(true)
    expect(hasPosition(moves, { file: 5, rank: 8 })).toBe(false)
  })

  it('uses the opposite forward direction for Han', () => {
    const position = { file: 5, rank: 4 }
    const board = makeTestBoard([{ position, type: 'JOL', side: 'HAN' }])
    const moves = generateJolMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 5 })).toBe(true)
    expect(hasPosition(moves, { file: 5, rank: 3 })).toBe(false)
  })

  it('can move diagonally forward along lines in the enemy palace', () => {
    const position = { file: 4, rank: 3 }
    const board = makeTestBoard([{ position, type: 'JOL', side: 'CHO' }])
    const moves = generateJolMoves(board, position)

    expect(hasPosition(moves, { file: 5, rank: 2 })).toBe(true)
  })

  it('can branch to both forward corners from the enemy palace center', () => {
    const position = { file: 5, rank: 2 }
    const board = makeTestBoard([{ position, type: 'JOL', side: 'CHO' }])
    const moves = generateJolMoves(board, position)

    expect(hasPosition(moves, { file: 4, rank: 1 })).toBe(true)
    expect(hasPosition(moves, { file: 6, rank: 1 })).toBe(true)
  })

  it('does not gain diagonal movement in its own palace', () => {
    const position = { file: 4, rank: 1 }
    const board = makeTestBoard([{ position, type: 'JOL', side: 'HAN' }])

    expect(hasPosition(generateJolMoves(board, position), { file: 5, rank: 2 })).toBe(false)
  })

  it('respects friendly and enemy destinations', () => {
    const position = { file: 5, rank: 5 }
    const board = makeTestBoard([
      { position, type: 'JOL', side: 'CHO' },
      { position: { file: 4, rank: 5 }, type: 'JOL', side: 'CHO' },
      { position: { file: 6, rank: 5 }, type: 'JOL', side: 'HAN' },
    ])
    const moves = generateJolMoves(board, position)

    expect(hasPosition(moves, { file: 4, rank: 5 })).toBe(false)
    expect(hasPosition(moves, { file: 6, rank: 5 })).toBe(true)
  })
})