import { describe, expect, it } from 'vitest'
import { createEmptyBoard, createInitialState, getPiece, withPiece } from './board'
import { generateLegalMoves, isAttacked, isCheck, makeMove, pass, undoMove } from './rules'
import type { GameState } from './types'

const hanGung = { side: 'HAN', type: 'GUNG' } as const
const choGung = { side: 'CHO', type: 'GUNG' } as const
const hanCha = { side: 'HAN', type: 'CHA' } as const
const choCha = { side: 'CHO', type: 'CHA' } as const
const choJol = { side: 'CHO', type: 'JOL' } as const
const choPo = { side: 'CHO', type: 'PO' } as const
const hanJol = { side: 'HAN', type: 'JOL' } as const

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

describe('rules', () => {
  it('recognizes a general attacked by an opposing rook', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)
    board = withPiece(board, { file: 5, rank: 9 }, choGung)
    board = withPiece(board, { file: 5, rank: 5 }, choCha)

    expect(isCheck(stateWith(board, 'HAN'), 'HAN')).toBe(true)
  })

  it('removes a move that exposes its own general to check', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)
    board = withPiece(board, { file: 5, rank: 9 }, choGung)
    board = withPiece(board, { file: 5, rank: 4 }, hanCha)
    board = withPiece(board, { file: 5, rank: 6 }, choCha)

    const legalMoves = generateLegalMoves(stateWith(board, 'HAN'))
    expect(legalMoves.some((move) => move.from?.file === 5 && move.from.rank === 4 && move.to?.file === 4 && move.to.rank === 4)).toBe(false)
  })

  it('returns a new state when a legal move captures a piece', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)
    board = withPiece(board, { file: 5, rank: 9 }, choGung)
    board = withPiece(board, { file: 4, rank: 5 }, hanCha)
    board = withPiece(board, { file: 4, rank: 7 }, choJol)
    const state = stateWith(board, 'HAN')
    const capture = generateLegalMoves(state).find(
      (move) => move.from?.file === 4 && move.from.rank === 5 && move.to?.file === 4 && move.to.rank === 7,
    )

    expect(capture).toBeDefined()
    const nextState = makeMove(state, capture!)
    expect(getPiece(state.board, { file: 4, rank: 7 })).toEqual(choJol)
    expect(getPiece(nextState.board, { file: 4, rank: 7 })).toEqual(hanCha)
    expect(nextState.capturedPieces).toEqual([choJol])
    expect(nextState.turn).toBe('CHO')
  })

  it('allows a pass only outside check and undo restores the previous state', () => {
    const initialState = createInitialState()
    const passedState = pass(initialState)

    expect(passedState.turn).toBe('HAN')
    expect(undoMove(passedState)).toEqual(initialState)
  })

  it('rejects a pass while in check', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)
    board = withPiece(board, { file: 5, rank: 9 }, choGung)
    board = withPiece(board, { file: 5, rank: 5 }, choCha)

    expect(() => pass(stateWith(board, 'HAN'))).toThrow()
  })

  it('judges a cannon check with the same one-screen rule as a cannon move', () => {
    // No screen between the cannon and the general: not attacked.
    let bare = withPiece(createEmptyBoard(), { file: 5, rank: 1 }, hanGung)
    bare = withPiece(bare, { file: 5, rank: 9 }, choGung)
    bare = withPiece(bare, { file: 5, rank: 6 }, choPo)
    expect(isAttacked(bare, { file: 5, rank: 1 }, 'CHO')).toBe(false)

    // Exactly one (non-cannon) screen: the general is in check.
    const screened = withPiece(bare, { file: 5, rank: 4 }, choJol)
    expect(isAttacked(screened, { file: 5, rank: 1 }, 'CHO')).toBe(true)
    expect(isCheck(stateWith(screened, 'HAN'), 'HAN')).toBe(true)

    // Two screens: the shot is blocked again.
    const doubled = withPiece(screened, { file: 5, rank: 3 }, hanJol)
    expect(isAttacked(doubled, { file: 5, rank: 1 }, 'CHO')).toBe(false)
  })

  it('never offers a move that captures the enemy general', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)
    board = withPiece(board, { file: 5, rank: 8 }, choGung)
    board = withPiece(board, { file: 4, rank: 8 }, hanCha)
    const captures = generateLegalMoves(stateWith(board, 'HAN')).filter(
      (move) => move.captured?.type === 'GUNG',
    )
    expect(captures).toHaveLength(0)
  })
})
