import { describe, expect, it } from 'vitest'
import { getPiece } from './board'
import { hasPosition, makeTestBoard, makeTestState } from './test-utils'
import { generateLegalMoves, isAttacked, isCheck, makeMove, pass } from './rules'

describe('attack and check detection', () => {
  it('detects line attacks and blockers', () => {
    const openBoard = makeTestBoard([
      { position: { file: 5, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 5 }, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    expect(isCheck(makeTestState(openBoard), 'HAN')).toBe(true)

    const blockedBoard = makeTestBoard([
      { position: { file: 5, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 3 }, type: 'SA', side: 'HAN' },
      { position: { file: 5, rank: 5 }, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    expect(isCheck(makeTestState(blockedBoard), 'HAN')).toBe(false)
  })

  it('uses the same screen rule for Po attacks', () => {
    const board = makeTestBoard([
      { position: { file: 5, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 4 }, type: 'JOL', side: 'HAN' },
      { position: { file: 5, rank: 5 }, type: 'PO', side: 'CHO' },
      { position: { file: 4, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])

    expect(isAttacked(board, { file: 5, rank: 2 }, 'CHO')).toBe(true)
  })
})

describe('legal moves', () => {
  it('removes moves that expose the moving side Gung', () => {
    const board = makeTestBoard([
      { position: { file: 4, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 1 }, type: 'CHA', side: 'HAN' },
      { position: { file: 5, rank: 5 }, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const moves = generateLegalMoves(makeTestState(board))
    const chaMoves = moves.filter((move) => move.from.file === 5 && move.from.rank === 5)

    expect(hasPosition(chaMoves.map((move) => move.to), { file: 4, rank: 5 })).toBe(false)
    expect(hasPosition(chaMoves.map((move) => move.to), { file: 5, rank: 4 })).toBe(true)
  })

  it('keeps only moves that resolve an existing check', () => {
    const board = makeTestBoard([
      { position: { file: 4, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 1 }, type: 'CHA', side: 'HAN' },
      { position: { file: 4, rank: 8 }, type: 'CHA', side: 'CHO' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const state = makeTestState(board)
    const moves = generateLegalMoves(state)
    const chaMoves = moves.filter((move) => move.from.file === 4 && move.from.rank === 8)

    expect(isCheck(state, 'CHO')).toBe(true)
    expect(hasPosition(chaMoves.map((move) => move.to), { file: 5, rank: 8 })).toBe(true)
    expect(hasPosition(chaMoves.map((move) => move.to), { file: 4, rank: 7 })).toBe(false)
  })
})

describe('state transitions', () => {
  it('makes an immutable capturing move and records it', () => {
    const board = makeTestBoard([
      { position: { file: 4, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 4, rank: 5 }, type: 'CHA', side: 'CHO' },
      { position: { file: 6, rank: 5 }, type: 'JOL', side: 'HAN' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const state = makeTestState(board)
    const next = makeMove(state, {
      from: { file: 4, rank: 5 },
      to: { file: 6, rank: 5 },
    })

    expect(getPiece(state.board, { file: 4, rank: 5 })?.type).toBe('CHA')
    expect(getPiece(next.board, { file: 4, rank: 5 })).toBeNull()
    expect(getPiece(next.board, { file: 6, rank: 5 })?.side).toBe('CHO')
    expect(next.turn).toBe('HAN')
    expect(next.moveHistory).toHaveLength(1)
    expect(next.capturedPieces[0]?.type).toBe('JOL')
  })

  it('allows a pass only when the current side is not in check', () => {
    const safeBoard = makeTestBoard([
      { position: { file: 4, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    const passed = pass(makeTestState(safeBoard))
    expect(passed.turn).toBe('HAN')
    expect(passed.moveHistory[0]?.isPass).toBe(true)

    const checkedBoard = makeTestBoard([
      { position: { file: 4, rank: 2 }, type: 'GUNG', side: 'HAN' },
      { position: { file: 5, rank: 1 }, type: 'CHA', side: 'HAN' },
      { position: { file: 5, rank: 9 }, type: 'GUNG', side: 'CHO' },
    ])
    expect(() => pass(makeTestState(checkedBoard))).toThrow('장군')
  })
})