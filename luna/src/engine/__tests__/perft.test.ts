import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../rules'
import { perft } from '../perft'

describe('initial position perft', () => {
  it('reports deterministic depth 1-3 legal move counts', () => {
    const state = createInitialGameState()
    const counts = [1, 2, 3].map((depth) => perft(state, depth))
    expect(counts).toEqual([31, 961, 30661])
  })
})