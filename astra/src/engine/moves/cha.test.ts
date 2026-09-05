import { describe, expect, it } from 'vitest'
import { hasPosition, makeBoard } from '../test-utils'
import { generateChaMoves } from './cha'

describe('Cha', () => {
  it('has 17 moves at the center of an empty board', () => {
    expect(generateChaMoves(makeBoard([5, 5, 'CHA']), { file: 5, rank: 5 })).toHaveLength(17)
  })
  it('stops before friendly pieces', () => {
    const moves = generateChaMoves(makeBoard([5, 5, 'CHA'], [5, 3, 'JOL']), { file: 5, rank: 5 })
    expect(hasPosition(moves, 5, 4)).toBe(true)
    expect(hasPosition(moves, 5, 3)).toBe(false)
    expect(hasPosition(moves, 5, 2)).toBe(false)
  })
  it('captures an enemy and stops', () => {
    const moves = generateChaMoves(makeBoard([5, 5, 'CHA'], [7, 5, 'JOL', 'HAN']), { file: 5, rank: 5 })
    expect(hasPosition(moves, 7, 5)).toBe(true)
    expect(hasPosition(moves, 8, 5)).toBe(false)
  })
  it('crosses a palace diagonal but never continues outside', () => {
    const moves = generateChaMoves(makeBoard([4, 1, 'CHA']), { file: 4, rank: 1 })
    expect(hasPosition(moves, 5, 2)).toBe(true)
    expect(hasPosition(moves, 6, 3)).toBe(true)
    expect(hasPosition(moves, 7, 4)).toBe(false)
  })
  it('cannot cross an occupied palace center', () => {
    const moves = generateChaMoves(makeBoard([4, 1, 'CHA'], [5, 2, 'SA']), { file: 4, rank: 1 })
    expect(hasPosition(moves, 5, 2)).toBe(false)
    expect(hasPosition(moves, 6, 3)).toBe(false)
  })
  it('can capture at the center but cannot go beyond it', () => {
    const moves = generateChaMoves(makeBoard([4, 1, 'CHA'], [5, 2, 'SA', 'HAN']), { file: 4, rank: 1 })
    expect(hasPosition(moves, 5, 2)).toBe(true)
    expect(hasPosition(moves, 6, 3)).toBe(false)
  })
})