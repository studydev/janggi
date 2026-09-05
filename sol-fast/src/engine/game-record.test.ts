import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { deserializeGame, replayState, serializeGame } from './game-record'
import { formatMove } from './janggi-notation'
import { generateLegalMoves, makeMove, pass } from './rules'
import type { Move } from './types'

describe('Janggi notation', () => {
  it('formats a move from one shared notation function', () => {
    const move: Move = {
      from: { file: 1, rank: 7 },
      to: { file: 1, rank: 6 },
      piece: { id: 'CHO-JOL-1', side: 'CHO', type: 'JOL' },
      captured: null,
      isPass: false,
    }

    expect(formatMove(move, 'HANGUL')).toBe('1-7 졸 1-6')
    expect(formatMove(move, 'HANJA')).toBe('1-7 卒 1-6')
  })

  it('formats pass without coordinates', () => {
    const move: Move = { from: null, to: null, piece: null, captured: null, isPass: true }
    expect(formatMove(move)).toBe('한 수 쉼')
  })
})

describe('game records', () => {
  it('round-trips a played game through JSON', () => {
    const initial = createInitialState('MSSM', 'SMMS')
    const moved = makeMove(initial, generateLegalMoves(initial)[0])
    const played = pass(moved)

    expect(deserializeGame(serializeGame(played))).toEqual(played)
  })

  it('reconstructs any ply without changing the saved live state', () => {
    const initial = createInitialState()
    const first = makeMove(initial, generateLegalMoves(initial)[0])
    const played = makeMove(first, generateLegalMoves(first)[0])

    expect(replayState(played, 0)).toEqual(initial)
    expect(replayState(played, 1)).toEqual(first)
    expect(replayState(played, 2)).toEqual(played)
    expect(played.moveHistory).toHaveLength(2)
  })

  it('rejects malformed game JSON', () => {
    expect(() => deserializeGame('{"version":1,"state":{}}')).toThrow('기보')
  })
})