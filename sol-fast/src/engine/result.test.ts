import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  createInitialState,
  createPiece,
  DEFAULT_CONFIG,
  DEFAULT_SETUP,
  positionHash,
  positionToIndex,
} from './board'
import {
  calculateScore,
  getGameResult,
  isBikjang,
  isCheckmate,
  isRepetition,
} from './result'
import type { GameState, PieceType, Position, Side } from './types'

function stateWith(entries: Array<[Position, Side, PieceType]>, turn: Side): GameState {
  const board = createEmptyBoard()
  entries.forEach(([position, side, type], index) => {
    board[positionToIndex(position)] = createPiece(side, type, `result-${index}`)
  })
  return {
    board,
    turn,
    moveHistory: [],
    capturedPieces: [],
    config: DEFAULT_CONFIG,
    setup: DEFAULT_SETUP,
    positionHistory: [positionHash(board, turn)],
  }
}

describe('game result', () => {
  it('calculates material and the HAN compensation', () => {
    const state = createInitialState()
    expect(calculateScore(state, 'CHO')).toBe(72)
    expect(calculateScore(state, 'HAN')).toBe(73.5)
  })

  it('detects checkmate without treating ordinary immobility as defeat', () => {
    const state = stateWith([
      [{ file: 5, rank: 1 }, 'HAN', 'GUNG'],
      [{ file: 5, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 4, rank: 4 }, 'CHO', 'CHA'],
      [{ file: 5, rank: 4 }, 'CHO', 'CHA'],
      [{ file: 6, rank: 4 }, 'CHO', 'CHA'],
    ], 'HAN')
    expect(isCheckmate(state, 'HAN')).toBe(true)
    expect(getGameResult(state)).toMatchObject({ status: 'CHECKMATE', winner: 'CHO' })
  })

  it('detects open-file bikjang and honors the config switch', () => {
    const state = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 5, rank: 9 }, 'CHO', 'GUNG'],
    ], 'CHO')
    expect(isBikjang(state)).toBe(true)
    expect(isBikjang({ ...state, config: { ...state.config, bikjang: false } })).toBe(false)
  })

  it('detects the configured number of repeated positions', () => {
    const state = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 4, rank: 9 }, 'CHO', 'GUNG'],
    ], 'CHO')
    const hash = positionHash(state.board, state.turn)
    expect(isRepetition({ ...state, positionHistory: [hash, hash, hash] })).toBe(true)
  })
})