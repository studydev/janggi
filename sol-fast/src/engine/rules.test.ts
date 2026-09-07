import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  createPiece,
  DEFAULT_CONFIG,
  DEFAULT_SETUP,
  getPiece,
  positionHash,
  positionToIndex,
} from './board'
import {
  generateLegalMoves,
  getLegalMovesFrom,
  isAttacked,
  isCheck,
  makeMove,
  passTurn,
  undoMove,
} from './rules'
import type { GameState, PieceType, Position, Side } from './types'

function stateWith(entries: Array<[Position, Side, PieceType]>, turn: Side): GameState {
  const board = createEmptyBoard()
  entries.forEach(([position, side, type], index) => {
    board[positionToIndex(position)] = createPiece(side, type, `rule-${index}`)
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

describe('attack and legal move filtering', () => {
  it('detects attacks by reusing piece move generators', () => {
    const state = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 5, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 5, rank: 6 }, 'CHO', 'CHA'],
    ], 'HAN')
    expect(isAttacked(state.board, { file: 5, rank: 2 }, 'CHO')).toBe(true)
    expect(isCheck(state, 'HAN')).toBe(true)
  })

  it('removes a move that would expose its own general', () => {
    const state = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 4, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 5, rank: 7 }, 'CHO', 'CHA'],
      [{ file: 5, rank: 5 }, 'HAN', 'JOL'],
    ], 'HAN')
    const moves = getLegalMovesFrom(state, { file: 5, rank: 5 })
    expect(moves.some((move) => move.to.file === 4 && move.to.rank === 5)).toBe(false)
    expect(moves.some((move) => move.to.file === 5 && move.to.rank === 6)).toBe(true)
  })

  it('never generates a move that captures the opposing general', () => {
    const state = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 4, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 5, rank: 4 }, 'CHO', 'CHA'],
    ], 'CHO')
    expect(generateLegalMoves(state).some((move) => (
      move.to.file === 5 && move.to.rank === 2
    ))).toBe(false)
  })
})

describe('immutable game actions', () => {
  it('records a capture and undo restores the exact state', () => {
    const state = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 5, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 1, rank: 5 }, 'CHO', 'CHA'],
      [{ file: 1, rank: 3 }, 'HAN', 'MA'],
      [{ file: 5, rank: 6 }, 'HAN', 'JOL'],
    ], 'CHO')
    const next = makeMove(state, {
      from: { file: 1, rank: 5 },
      to: { file: 1, rank: 3 },
    })

    expect(getPiece(state.board, { file: 1, rank: 5 })?.type).toBe('CHA')
    expect(getPiece(next.board, { file: 1, rank: 3 })?.type).toBe('CHA')
    expect(next.capturedPieces).toHaveLength(1)
    expect(undoMove(next)).toEqual(state)
  })

  it('allows a pass only while not in check', () => {
    const safe = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 5, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 5, rank: 5 }, 'HAN', 'JOL'],
    ], 'CHO')
    expect(passTurn(safe).moveHistory.at(-1)?.isPass).toBe(true)

    const checked = stateWith([
      [{ file: 5, rank: 2 }, 'HAN', 'GUNG'],
      [{ file: 4, rank: 9 }, 'CHO', 'GUNG'],
      [{ file: 5, rank: 5 }, 'CHO', 'CHA'],
    ], 'HAN')
    expect(() => passTurn(checked)).toThrow('장군')
  })
})
