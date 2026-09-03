import { describe, expect, it } from 'vitest'
import { emptyBoard, placePiece, createPiece, otherSide } from '../board'
import { createGameState as createState, generateLegalMoves, isAttacked, isCheck, makeMove, pass } from '../rules'
import { calculateScore, getGameResult, isBikjang } from '../result'
import type { Board, PieceType, Position, Side } from '../types'

function boardWith(...pieces: Array<[Side, PieceType, Position]>): Board {
  let board = emptyBoard()
  pieces.forEach(([side, type, position], index) => {
    board = placePiece(board, position, createPiece(side, type, `${side}-${type}-${index}`))
  })
  return board
}

describe('legal moves and state transitions', () => {
  it('starts with Cho to move and never generates a king capture', () => {
    const state = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['CHO', 'GUNG', { file: 5, rank: 9 }],
      ['CHO', 'CHA', { file: 1, rank: 10 }],
    ), 'CHO')
    expect(state.turn).toBe('CHO')
    expect(generateLegalMoves(state).every((move) => move.captured?.type !== 'GUNG')).toBe(true)
  })

  it('filters a move that exposes the moving side king', () => {
    const state = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['HAN', 'CHA', { file: 5, rank: 3 }],
      ['CHO', 'CHA', { file: 5, rank: 5 }],
      ['CHO', 'GUNG', { file: 9, rank: 10 }],
    ), 'HAN')
    expect(isCheck(state, 'HAN')).toBe(false)
    expect(generateLegalMoves(state).some((move) => move.from.file === 5 && move.from.rank === 3 && move.to.file === 4 && move.to.rank === 3)).toBe(false)
  })

  it('keeps the source state immutable and records captures', () => {
    const state = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['CHO', 'GUNG', { file: 5, rank: 9 }],
      ['CHO', 'CHA', { file: 1, rank: 1 }],
      ['HAN', 'JOL', { file: 1, rank: 2 }],
    ), 'CHO')
    const move = generateLegalMoves(state).find((candidate) => candidate.from.file === 1 && candidate.from.rank === 1 && candidate.to.file === 1 && candidate.to.rank === 2)
    expect(move).toBeDefined()
    const nextState = makeMove(state, move!)
    expect(state.board[0]?.side).toBe('CHO')
    expect(nextState.board[9]?.side).toBe('CHO')
    expect(nextState.capturedPieces.CHO).toHaveLength(1)
    expect(nextState.moveHistory).toHaveLength(1)
  })

  it('allows a pass only when the side is not in check', () => {
    const safeState = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['CHO', 'GUNG', { file: 5, rank: 9 }],
    ), 'CHO')
    const passed = pass(safeState)
    expect(passed.turn).toBe(otherSide(safeState.turn))
    expect(passed.moveHistory[0]?.isPass).toBe(true)

    const checkedState = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['CHO', 'GUNG', { file: 5, rank: 9 }],
      ['CHO', 'CHA', { file: 5, rank: 5 }],
    ), 'HAN')
    expect(isAttacked(checkedState.board, { file: 5, rank: 2 }, 'CHO')).toBe(true)
    expect(() => pass(checkedState)).toThrow()
  })
})

describe('draw and score results', () => {
  it('detects bikjang only when the file between kings is empty', () => {
    const open = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['CHO', 'GUNG', { file: 5, rank: 9 }],
    ), 'CHO')
    const blocked = createState(boardWith(
      ['HAN', 'GUNG', { file: 5, rank: 2 }],
      ['CHO', 'GUNG', { file: 5, rank: 9 }],
      ['HAN', 'JOL', { file: 5, rank: 5 }],
    ), 'CHO')
    expect(isBikjang(open)).toBe(true)
    expect(isBikjang(blocked)).toBe(false)
  })

  it('gives Han the 1.5 point 후수 bonus and resolves repeated positions by score', () => {
    const state = createState(
      boardWith(['HAN', 'GUNG', { file: 5, rank: 2 }], ['CHO', 'GUNG', { file: 5, rank: 9 }], ['HAN', 'JOL', { file: 1, rank: 4 }]),
      'CHO',
      { bikjangEnabled: false, repetitionLimit: 2 },
    )
    expect(calculateScore(state, 'HAN')).toBe(3.5)
    const repeated = pass(pass(state))
    const result = getGameResult(repeated)
    expect(result.status).toBe('DRAW_BY_REPETITION')
    expect(result.winner).toBe('HAN')
  })
})