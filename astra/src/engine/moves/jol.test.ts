import { describe, expect, it } from 'vitest'
import { hasPosition, makeBoard } from '../test-utils'
import { generateJolMoves } from './jol'

describe('Jol and Byeong', () => {
  it.each([['CHO', 7, 6], ['HAN', 4, 5]] as const)('%s moves sideways immediately and never backward', (side, rank, nextRank) => {
    const moves = generateJolMoves(makeBoard([5, rank, 'JOL', side]), { file: 5, rank })
    expect(moves).toHaveLength(3)
    expect(hasPosition(moves, 4, rank)).toBe(true)
    expect(hasPosition(moves, 6, rank)).toBe(true)
    expect(hasPosition(moves, 5, nextRank)).toBe(true)
    expect(hasPosition(moves, 5, rank * 2 - nextRank)).toBe(false)
  })
  it.each([['CHO', 3, 2], ['HAN', 8, 9]] as const)('%s advances on an enemy palace diagonal', (side, rank, nextRank) => {
    const moves = generateJolMoves(makeBoard([4, rank, 'JOL', side]), { file: 4, rank })
    expect(hasPosition(moves, 5, nextRank)).toBe(true)
  })
  it.each([['CHO', 10], ['HAN', 1]] as const)('%s has no own-palace diagonal move', (side, rank) => {
    const moves = generateJolMoves(makeBoard([4, rank, 'JOL', side]), { file: 4, rank })
    expect(moves.every((target) => target.file === 4 || target.rank === rank)).toBe(true)
  })
  it('has only forward diagonals at the enemy palace center', () => {
    const moves = generateJolMoves(makeBoard([5, 2, 'JOL']), { file: 5, rank: 2 })
    expect(hasPosition(moves, 4, 1)).toBe(true)
    expect(hasPosition(moves, 6, 1)).toBe(true)
    expect(hasPosition(moves, 4, 3)).toBe(false)
  })
  it('does not promote or move backward at the far edge', () => {
    expect(generateJolMoves(makeBoard([5, 1, 'JOL']), { file: 5, rank: 1 })).toHaveLength(2)
  })
  it('captures an enemy but cannot land on an ally', () => {
    const moves = generateJolMoves(makeBoard([5, 5, 'JOL'], [4, 5, 'CHA', 'HAN'], [6, 5, 'JOL']), { file: 5, rank: 5 })
    expect(hasPosition(moves, 4, 5)).toBe(true)
    expect(hasPosition(moves, 6, 5)).toBe(false)
  })
})