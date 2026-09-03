import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { playRandomGame } from './playout'
import { getGameResult } from './result'
import { replayHistory, stateAtMove } from './rules'
import { perft, runRandomGames, verifyPlayout } from './verification'

describe('engine verification', () => {
  it('keeps a fixed initial-position perft baseline', () => {
    const initialState = createInitialState()

    expect([perft(initialState, 1), perft(initialState, 2), perft(initialState, 3)]).toEqual([
      31, 961, 30506,
    ])
  })

  it('holds every rule invariant across many full random games', () => {
    const result = runRandomGames(300, 300, 20260903)

    expect(result.games).toBe(300)
    expect(result.plies).toBeGreaterThan(4000)
    // Random play almost always produces a decisive or drawn ending well
    // before the ply cap; a healthy chunk are true checkmates.
    expect(result.finished).toBeGreaterThan(result.games * 0.7)
    expect(result.checkmates).toBeGreaterThan(0)
  }, 60000)

  it('replays a completed playout to an identical final state', () => {
    for (const seed of [1, 7, 42, 1234, 99999]) {
      const playout = playRandomGame(seed, 320)
      const rebuilt = replayHistory(playout.state.config, playout.state.moveHistory)

      expect(rebuilt).toEqual(playout.state)
      expect(getGameResult(rebuilt)).toEqual(playout.result)
      verifyPlayout(seed, 320)
    }
  })

  it('stateAtMove reconstructs any midpoint of a game', () => {
    const playout = playRandomGame(2468, 320)
    const total = playout.state.moveHistory.length
    expect(total).toBeGreaterThan(2)

    for (const count of [0, 1, Math.floor(total / 2), total - 1, total]) {
      const rebuilt = stateAtMove(playout.state, count)
      expect(rebuilt.moveHistory).toHaveLength(count)
      expect(rebuilt).toEqual(replayHistory(playout.state.config, playout.state.moveHistory.slice(0, count)))
    }
  })
})
