import { describe, expect, it } from 'vitest'
import { createInitialState, getPiece } from './board'
import { generateLegalMoves, isAttacked, isCheck, makeMove, pass, undoMove } from './rules'
import { makeBoard, makeState } from './test-utils'

describe('check and legal moves', () => {
  it('starts without check and never generates a king capture', () => {
    const state = createInitialState()
    expect(isCheck(state, 'HAN')).toBe(false)
    expect(isCheck(state, 'CHO')).toBe(false)
    const capturePosition = makeState(makeBoard([5, 9, 'GUNG'], [4, 2, 'GUNG', 'HAN'], [4, 5, 'CHA']))
    expect(isAttacked(capturePosition.board, { file: 4, rank: 2 }, 'CHO')).toBe(true)
    expect(generateLegalMoves(capturePosition).every((move) => move.captured?.type !== 'GUNG')).toBe(true)
  })
  it('filters moves that uncover an attack on the moving side king', () => {
    const state = makeState(makeBoard([5, 9, 'GUNG'], [4, 2, 'GUNG', 'HAN'], [5, 5, 'CHA', 'HAN'], [5, 7, 'CHA']))
    expect(isCheck(state, 'CHO')).toBe(false)
    expect(() => makeMove(state, { from: { file: 5, rank: 7 }, to: { file: 4, rank: 7 } })).toThrow()
    const next = makeMove(state, { from: { file: 5, rank: 7 }, to: { file: 5, rank: 5 } })
    expect(isCheck(next, 'CHO')).toBe(false)
  })
  it('uses exactly the same Po screen rule for attacks', () => {
    const base = [[5, 9, 'GUNG'], [4, 2, 'GUNG', 'HAN'], [5, 1, 'PO', 'HAN']] as const
    expect(isCheck(makeState(makeBoard(...base)), 'CHO')).toBe(false)
    expect(isCheck(makeState(makeBoard(...base, [5, 5, 'MA'])), 'CHO')).toBe(true)
    expect(isCheck(makeState(makeBoard(...base, [5, 5, 'PO'])), 'CHO')).toBe(false)
    expect(isCheck(makeState(makeBoard(...base, [5, 5, 'MA'], [5, 7, 'JOL'])), 'CHO')).toBe(false)
  })
  it('requires check to be resolved and disallows passing in check', () => {
    const state = makeState(makeBoard([5, 9, 'GUNG'], [4, 2, 'GUNG', 'HAN'], [5, 5, 'CHA', 'HAN']))
    expect(isCheck(state, 'CHO')).toBe(true)
    expect(() => pass(state)).toThrow()
    for (const move of generateLegalMoves(state)) expect(isCheck(makeMove(state, move), 'CHO')).toBe(false)
  })
  it('does not treat facing kings as a flying king attack', () => {
    const state = makeState(makeBoard([5, 9, 'GUNG'], [5, 2, 'GUNG', 'HAN']))
    expect(isCheck(state, 'CHO')).toBe(false)
    expect(isCheck(state, 'HAN')).toBe(false)
  })
  it('rejects wrong-turn and off-board moves', () => {
    const state = createInitialState()
    expect(() => makeMove(state, { from: { file: 1, rank: 4 }, to: { file: 1, rank: 5 } })).toThrow()
    expect(() => makeMove(state, { from: { file: 1, rank: 7 }, to: { file: 0, rank: 7 } })).toThrow()
  })
})

describe('immutable transitions', () => {
  it('records a capture and restores every field on undo', () => {
    const state = makeState(makeBoard([5, 9, 'GUNG'], [4, 2, 'GUNG', 'HAN'], [1, 5, 'CHA'], [1, 2, 'MA', 'HAN']))
    const original = JSON.stringify(state)
    Object.freeze(state.board)
    Object.freeze(state.moveHistory)
    Object.freeze(state)
    const next = makeMove(state, { from: { file: 1, rank: 5 }, to: { file: 1, rank: 2 } })
    expect(next.turn).toBe('HAN')
    expect(next.capturedPieces).toHaveLength(1)
    expect(next.moveHistory[0].captured?.type).toBe('MA')
    expect(getPiece(next.board, { file: 1, rank: 5 })).toBe(null)
    expect(undoMove(next)).toEqual(state)
    expect(JSON.stringify(state)).toBe(original)
  })
  it('restores every possible initial move and pass', () => {
    const state = createInitialState()
    for (const move of generateLegalMoves(state)) expect(undoMove(makeMove(state, move))).toEqual(state)
    const next = pass(state)
    expect(next.board).toBe(state.board)
    expect(next.moveHistory[0]).toEqual({ from: null, to: null, piece: null, captured: null, isPass: true })
    expect(undoMove(next)).toEqual(state)
    expect(undoMove(state)).toBe(state)
  })
})