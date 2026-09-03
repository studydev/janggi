import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { generateLegalMoves, makeMove, undoMove } from './rules'
import { perft, validateRandomGames } from './validation'

describe('engine validation', () => {
  it(
    'keeps fixed initial perft depth one through three baselines including pass',
    () => {
      const state = createInitialState('MSMS', 'MSMS')
      expect([perft(state, 1), perft(state, 2), perft(state, 3)]).toEqual([32, 1024, 33506])
    },
    60_000,
  )

  it('restores the exact state after makeMove and undoMove', () => {
    const state = createInitialState('MSSM', 'SMMS')
    const move = generateLegalMoves(state)[0]
    expect(move).toBeDefined()

    const restored = undoMove(makeMove(state, move))
    expect(restored).toEqual(state)
  })

  it('preserves engine invariants through random games', () => {
    const report = validateRandomGames(20, 20260903, 80)

    expect(report.violations).toEqual([])
    expect(report.games).toBe(20)
    expect(report.totalPlies).toBeGreaterThan(0)
  })
})