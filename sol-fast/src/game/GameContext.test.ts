import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, DEFAULT_SETUP } from '../engine/board'
import { gameReducer, initialAppState } from './game-state'

describe('game reducer', () => {
  it('starts a local game and routes moves through the engine', () => {
    const started = gameReducer(initialAppState, {
      type: 'START',
      setup: DEFAULT_SETUP,
      config: DEFAULT_CONFIG,
      now: 10,
    })
    const moved = gameReducer(started, {
      type: 'MOVE',
      move: { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } },
    })
    expect(moved.game.moveHistory).toHaveLength(1)
    expect(moved.game.turn).toBe('HAN')
    expect(moved.startedAt).toBe(10)
  })

  it('blocks actions in replay mode until explicitly restored to live mode', () => {
    let state = gameReducer(initialAppState, {
      type: 'START',
      setup: DEFAULT_SETUP,
      config: DEFAULT_CONFIG,
      now: 10,
    })
    state = gameReducer(state, {
      type: 'MOVE',
      move: { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } },
    })
    const replay = gameReducer(state, { type: 'SET_REPLAY', index: 0 })
    expect(gameReducer(replay, { type: 'PASS' })).toBe(replay)
    expect(gameReducer(replay, { type: 'SET_REPLAY', index: 1 }).replayIndex).toBe(1)
    expect(gameReducer(replay, { type: 'SET_REPLAY', index: null }).replayIndex).toBeNull()
  })

  it('handles resignation and draw agreement', () => {
    const started = gameReducer(initialAppState, {
      type: 'START',
      setup: DEFAULT_SETUP,
      config: DEFAULT_CONFIG,
      now: 10,
    })
    expect(gameReducer(started, { type: 'RESIGN' }).result)
      .toMatchObject({ status: 'RESIGNED', winner: 'HAN' })

    const offered = gameReducer(started, { type: 'OFFER_DRAW' })
    expect(gameReducer(offered, { type: 'ACCEPT_DRAW' }).result.status).toBe('DRAW_AGREED')
  })
})