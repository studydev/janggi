import { describe, expect, it } from 'vitest'
import { createInitialState, hashPosition, setPiece } from './board'
import { makeTestBoard, makeTestState } from './test-utils'
import {
  calculateScore,
  getGameResult,
  isBikjang,
  isCheckmate,
  isRepetition,
} from './result'

describe('game result rules', () => {
  it('detects checkmate without treating non-check immobility as defeat', () => {
    const board = makeTestBoard([
      { position: { file: 4, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 1 }, type: 'CHA', side: 'HAN' },
      { position: { file: 4, rank: 7 }, type: 'CHA', side: 'HAN' },
      { position: { file: 6, rank: 7 }, type: 'CHA', side: 'HAN' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const state = makeTestState(board)

    expect(isCheckmate(state, 'CHO')).toBe(true)
    expect(getGameResult(state)).toMatchObject({ status: 'CHECKMATE', winner: 'HAN' })
  })

  it('detects facing Gungs only when Bikjang is enabled and unobstructed', () => {
    const board = makeTestBoard([
      { position: { file: 5, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const enabled = makeTestState(board)
    const disabled = { ...enabled, config: { ...enabled.config, bikjangEnabled: false } }

    expect(isBikjang(enabled)).toBe(true)
    expect(isBikjang(disabled)).toBe(false)
    expect(isBikjang({ ...enabled, board: setPiece(board, { file: 5, rank: 5 }, {
      id: 'blocker', type: 'JOL', side: 'CHO',
    }) })).toBe(false)
  })

  it('detects a configurable number of repeated board-and-turn positions', () => {
    const state = createInitialState()
    const currentHash = hashPosition(state.board, state.turn)
    const repeated = {
      ...state,
      positionHistory: [currentHash, 'other', currentHash, 'other-2', currentHash],
    }

    expect(isRepetition(repeated)).toBe(true)
    expect(isRepetition({ ...repeated, config: { ...repeated.config, repetitionCount: 4 } })).toBe(false)
  })

  it('calculates material with the Han compensation', () => {
    const state = createInitialState()

    expect(calculateScore(state, 'CHO')).toBe(72)
    expect(calculateScore(state, 'HAN')).toBe(73.5)
  })

  it('settles a Bikjang trigger by score', () => {
    const board = makeTestBoard([
      { position: { file: 5, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 1, rank: 4 }, type: 'JOL', side: 'HAN' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const result = getGameResult(makeTestState(board))

    expect(result.status).toBe('DRAW_BY_SCORE')
    expect(result.winner).toBe('HAN')
    expect(result.reason).toContain('빅장')
  })
})