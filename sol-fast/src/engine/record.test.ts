import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { formatMove } from './janggi-notation'
import { parseGame, replayGame, serializeGame } from './game-record'
import { makeMove, passTurn } from './rules'
import { perft, validateRandomGames } from './validation'

describe('game records', () => {
  it('formats moves in one notation module', () => {
    const state = makeMove(createInitialState(), {
      from: { file: 1, rank: 7 },
      to: { file: 1, rank: 6 },
    })
    expect(formatMove(state.moveHistory[0])).toBe('17 졸 16')
    expect(formatMove(passTurn(state).moveHistory[1])).toBe('한 수 쉼')
  })

  it('exports, imports, and replays a game through legal engine actions', () => {
    let state = createInitialState()
    state = makeMove(state, { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } })
    state = passTurn(state)
    const restored = parseGame(serializeGame(state))
    expect(restored).toEqual(state)
    expect(replayGame(restored, 1).moveHistory).toHaveLength(1)
    expect(replayGame(restored, 0).moveHistory).toHaveLength(0)
  })

  it('rejects malformed or illegal imported records', () => {
    expect(() => parseGame('{bad json')).toThrow('JSON')
    expect(() => parseGame(JSON.stringify({ version: 99 }))).toThrow('지원하지 않는')
  })
})

describe('engine validation', () => {
  it('counts a stable initial move tree', () => {
    const state = createInitialState()
    expect(perft(state, 1)).toBe(32)
    expect(perft(state, 2)).toBe(1024)
    expect(perft(state, 3)).toBe(33506)
  })

  it('preserves invariants over deterministic random games', () => {
    const result = validateRandomGames(5, 40)
    expect(result.games).toBe(5)
    expect(result.positions).toBeGreaterThan(0)
    expect(result.positions).toBeLessThanOrEqual(200)
  })
})