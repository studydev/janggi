import { describe, expect, it } from 'vitest'
import { hasPosition, makeBoard } from '../test-utils'
import { generateSangMoves } from './sang'

describe('Sang', () => {
  const from = { file: 5, rank: 5 }
  it('moves 1 straight plus 2 diagonal without a river restriction', () => {
    const moves = generateSangMoves(makeBoard([5, 5, 'SANG']), from)
    expect(moves).toHaveLength(8)
    expect(hasPosition(moves, 7, 8)).toBe(true)
    expect(hasPosition(moves, 7, 7)).toBe(false)
  })
  it.each([[3, 2], [3, -2], [-3, 2], [-3, -2], [2, 3], [-2, 3], [2, -3], [-2, -3]])(
    'checks both intermediate points for delta %s,%s', (fileDelta, rankDelta) => {
      const horizontal = Math.abs(fileDelta) === 3
      const fileSign = Math.sign(fileDelta)
      const rankSign = Math.sign(rankDelta)
      const blockers = [
        [5 + (horizontal ? fileSign : 0), 5 + (horizontal ? 0 : rankSign)],
        [5 + fileSign * (horizontal ? 2 : 1), 5 + rankSign * (horizontal ? 1 : 2)],
      ]
      for (const [file, rank] of blockers) {
        const moves = generateSangMoves(makeBoard([5, 5, 'SANG'], [file, rank, 'JOL', 'HAN']), from)
        expect(hasPosition(moves, 5 + fileDelta, 5 + rankDelta)).toBe(false)
      }
    },
  )
  it('can capture an enemy but not an ally', () => {
    const moves = generateSangMoves(makeBoard([5, 5, 'SANG'], [8, 7, 'CHA', 'HAN'], [8, 3, 'JOL']), from)
    expect(hasPosition(moves, 8, 7)).toBe(true)
    expect(hasPosition(moves, 8, 3)).toBe(false)
  })
  it('does not leave the board', () => {
    expect(generateSangMoves(makeBoard([1, 1, 'SANG']), { file: 1, rank: 1 })).toHaveLength(2)
  })
})