import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { calculateScore, getGameResult, isBikjang, isCheckmate, resignGame, scoreAgreement } from './result'
import { generateLegalMoves, isCheck, pass } from './rules'
import { makeBoard, makeState } from './test-utils'

describe('results and scoring', () => {
  it('starts at 72 points each before Han receives 1.5 compensation', () => {
    const state = createInitialState()
    expect(calculateScore(state, 'CHO')).toBe(72)
    expect(calculateScore(state, 'HAN')).toBe(73.5)
    expect(getGameResult(state).status).toBe('PLAYING')
  })
  it('uses the stated values for every piece', () => {
    const state = makeState(makeBoard([5, 9, 'GUNG'], [1, 1, 'CHA'], [2, 1, 'PO'], [3, 1, 'MA'], [4, 1, 'SANG'], [5, 1, 'SA'], [6, 1, 'JOL']))
    expect(calculateScore(state, 'CHO')).toBe(33)
  })
  it('detects facing kings only when enabled and unobstructed', () => {
    const board = makeBoard([5, 2, 'GUNG', 'HAN'], [5, 9, 'GUNG'])
    const state = makeState(board, 'CHO', { bikjangEnabled: true })
    expect(isBikjang(state)).toBe(true)
    expect(getGameResult(state)).toMatchObject({ status: 'DRAW_BY_SCORE', reason: 'BIKJANG', winner: 'HAN' })
    expect(isBikjang(makeState(board))).toBe(false)
    expect(isBikjang(makeState(makeBoard([5, 2, 'GUNG', 'HAN'], [5, 9, 'GUNG'], [5, 5, 'PO']), 'CHO', { bikjangEnabled: true }))).toBe(false)
  })
  it('counts repeated board plus turn, including passes', () => {
    let state = createInitialState('MSMS', 'MSMS', { repetitionCount: 3 })
    for (let count = 0; count < 3; count += 1) {
      state = pass(state)
      expect(getGameResult(state).status).toBe('PLAYING')
    }
    state = pass(state)
    expect(getGameResult(state)).toMatchObject({ status: 'DRAW_BY_SCORE', reason: 'REPETITION', winner: 'HAN' })
  })
  it('honors a different repetition threshold', () => {
    const state = createInitialState('MSMS', 'MSMS', { repetitionCount: 2 })
    expect(getGameResult(pass(pass(state))).reason).toBe('REPETITION')
  })
  it('recognizes checkmate', () => {
    const state = makeState(makeBoard([4, 10, 'GUNG'], [5, 2, 'GUNG', 'HAN'], [6, 9, 'CHA', 'HAN'], [5, 7, 'CHA', 'HAN'], [4, 9, 'JOL', 'HAN']))
    expect(isCheckmate(state, 'CHO')).toBe(true)
    expect(getGameResult(state)).toMatchObject({ status: 'CHECKMATE', winner: 'HAN' })
  })
  it('has no stalemate loss and allows a forced pass', () => {
    const state = makeState(makeBoard([4, 10, 'GUNG'], [5, 2, 'GUNG', 'HAN'], [6, 9, 'CHA', 'HAN'], [5, 7, 'CHA', 'HAN']))
    expect(isCheck(state, 'CHO')).toBe(false)
    expect(generateLegalMoves(state)).toHaveLength(0)
    expect(isCheckmate(state, 'CHO')).toBe(false)
    expect(getGameResult(state).status).toBe('PLAYING')
    expect(pass(state).turn).toBe('HAN')
  })
  it('awards an agreed draw by score and resignation to the opponent', () => {
    const state = createInitialState()
    expect(scoreAgreement(state)).toMatchObject({ status: 'DRAW_BY_SCORE', reason: 'AGREEMENT', winner: 'HAN' })
    expect(resignGame(state)).toMatchObject({ status: 'RESIGNED', reason: 'RESIGNATION', winner: 'HAN' })
    expect(resignGame(pass(state)).winner).toBe('CHO')
  })
})