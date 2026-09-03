import { describe, expect, it } from 'vitest'
import { createEmptyBoard, createInitialState, positionKey, withPiece } from './board'
import { calculateScore, getGameResult, isBikjang, isCheckmate } from './result'
import type { GameState } from './types'

const hanGung = { side: 'HAN', type: 'GUNG' } as const
const choGung = { side: 'CHO', type: 'GUNG' } as const
const choCha = { side: 'CHO', type: 'CHA' } as const

function stateWith(board: GameState['board'], turn: GameState['turn']): GameState {
  return {
    ...createInitialState(),
    board,
    turn,
    moveHistory: [],
    capturedPieces: [],
    positionHistory: [],
  }
}

describe('result rules', () => {
  it('recognizes checkmate only when a checked general has no legal response', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 1 }, hanGung)
    board = withPiece(board, { file: 5, rank: 9 }, choGung)
    board = withPiece(board, { file: 5, rank: 4 }, choCha)
    board = withPiece(board, { file: 4, rank: 3 }, choCha)
    board = withPiece(board, { file: 6, rank: 3 }, choCha)

    expect(isCheckmate(stateWith(board, 'HAN'), 'HAN')).toBe(true)
  })

  it('detects generals facing each other on an open file', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)
    board = withPiece(board, { file: 5, rank: 9 }, choGung)

    expect(isBikjang(stateWith(board, 'HAN'))).toBe(true)
  })

  it('calculates material and the Han handicap', () => {
    const initialState = createInitialState()

    expect(calculateScore(initialState, 'CHO')).toBe(72)
    expect(calculateScore(initialState, 'HAN')).toBe(73.5)
  })

  it('settles a repeated position through the score rule', () => {
    const initialState = createInitialState()
    const repeatedState: GameState = {
      ...initialState,
      positionHistory: Array(3).fill(positionKey(initialState.board, initialState.turn)),
    }

    expect(getGameResult(repeatedState)).toMatchObject({
      status: 'DRAW_BY_SCORE',
      winner: 'HAN',
      reason: '동일 국면 반복',
    })
  })
})
