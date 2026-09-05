import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { makeBoard, makeState } from './test-utils'
import { assertStateValid, perft, validateRandomGames } from './validation'

describe('engine verification', () => {
  it('matches fixed depth 1-3 perft baselines including pass', () => {
    const state = createInitialState()
    expect([perft(state, 1), perft(state, 2), perft(state, 3)]).toEqual([32, 1024, 33506])
    expect(perft(state, 0)).toBe(1)
    expect(() => perft(state, -1)).toThrow()
  })
  it('completes reproducible games without an invariant violation', () => {
    const report = validateRandomGames(20, 20260905)
    expect(report.games).toBe(20)
    expect(report.completedGames).toBe(20)
    expect(report.violations).toEqual([])
    expect(report.totalPlies).toBeGreaterThan(0)
  })
  it('rejects missing kings and guards outside their palace', () => {
    expect(() => assertStateValid(makeState(makeBoard([5, 9, 'GUNG'])))).toThrow()
    expect(() => assertStateValid(makeState(makeBoard([5, 9, 'GUNG'], [5, 2, 'GUNG', 'HAN'], [2, 5, 'SA'])))).toThrow()
  })
})