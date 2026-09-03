import { describe, expect, it } from 'vitest'
import { createInitialState, pieceAt } from './board'
import { at, scene } from './testkit'
import {
  canPass,
  generateLegalMoves,
  isAttacked,
  isCheck,
  makeMove,
  pass,
  undoMove,
} from './rules'
import type { GameState } from './types'

function state(partial: Partial<GameState>): GameState {
  return { ...createInitialState(), ...partial }
}

describe('isAttacked', () => {
  it('차의 사선 공격을 인식한다', () => {
    const board = scene({ '5,5': 'hR', '5,9': 'cK' })
    expect(isAttacked(board, at(5, 9), 'HAN')).toBe(true)
    expect(isAttacked(board, at(4, 9), 'HAN')).toBe(false)
  })

  it('포의 공격은 이동 규칙과 동일하게 판정된다 (포대 1개 필요)', () => {
    const noScreen = scene({ '5,5': 'hP', '5,9': 'cK' })
    expect(isAttacked(noScreen, at(5, 9), 'HAN')).toBe(false)
    const withScreen = scene({ '5,5': 'hP', '5,7': 'cJ', '5,9': 'cK' })
    expect(isAttacked(withScreen, at(5, 9), 'HAN')).toBe(true)
  })
})

describe('isCheck', () => {
  it('궁이 공격받으면 장군', () => {
    const board = scene({ '5,2': 'hK', '5,5': 'hR', '5,9': 'cK' })
    expect(isCheck(board, 'CHO')).toBe(true)
    expect(isCheck(board, 'HAN')).toBe(false)
  })
})

describe('generateLegalMoves', () => {
  it('자기 궁이 장군에 걸리는 수는 제외한다', () => {
    const s = state({ board: scene({ '5,2': 'hK', '5,5': 'hR', '5,9': 'cK' }), turn: 'CHO' })
    const moves = generateLegalMoves(s)
    // 초 궁(5,9)은 file 5 를 벗어나는 6곳으로만 피할 수 있다:
    // (4,9)(6,9) 직선, (4,8)(6,8)(4,10)(6,10) 대각.
    expect(moves).toHaveLength(6)
    for (const m of moves) expect(m.to!.file).not.toBe(5)
  })

  it('초기 국면에서 초(楚)는 둘 수 있는 수가 있다 (정확한 수치는 perft.test.ts 에서 고정)', () => {
    const moves = generateLegalMoves(createInitialState())
    expect(moves.length).toBeGreaterThan(0)
    // 초기 국면에서는 아무도 장군이 아니므로 모든 의사이동이 합법이어야 한다.
    for (const m of moves) expect(m.isPass).toBe(false)
  })

  it('상대 궁을 잡는 수는 합법수로 생성되지 않는다', () => {
    const s = state({ board: scene({ '9,9': 'cR', '9,1': 'hK', '5,5': 'cK' }), turn: 'CHO' })
    const moves = generateLegalMoves(s)
    expect(moves.some((m) => m.to!.file === 9 && m.to!.rank === 1)).toBe(false)
  })
})

describe('makeMove', () => {
  it('새 상태를 반환하고 원본은 불변', () => {
    const before = createInitialState()
    const after = makeMove(before, at(1, 7), at(1, 6))
    expect(before.moveHistory).toHaveLength(0)
    expect(pieceAt(before.board, at(1, 7))).toEqual({ side: 'CHO', type: 'JOL' })

    expect(after.turn).toBe('HAN')
    expect(after.moveHistory).toHaveLength(1)
    expect(pieceAt(after.board, at(1, 7))).toBeNull()
    expect(pieceAt(after.board, at(1, 6))).toEqual({ side: 'CHO', type: 'JOL' })
  })

  it('잡힌 기물을 기록한다', () => {
    const s = state({ board: scene({ '5,5': 'cR', '5,7': 'hM', '1,1': 'hK', '9,9': 'cK' }), turn: 'CHO' })
    const after = makeMove(s, at(5, 5), at(5, 7))
    expect(after.capturedPieces).toEqual([{ side: 'HAN', type: 'MA' }])
  })

  it('합법수가 아니면 throw', () => {
    expect(() => makeMove(createInitialState(), at(1, 7), at(1, 5))).toThrow()
  })
})

describe('pass', () => {
  it('한 수 쉬기: 보드는 그대로, 차례만 넘어간다', () => {
    const after = pass(createInitialState())
    expect(after.turn).toBe('HAN')
    expect(after.moveHistory[0].isPass).toBe(true)
  })

  it('장군 중에는 쉴 수 없다', () => {
    const s = state({ board: scene({ '5,2': 'hK', '5,5': 'hR', '5,9': 'cK' }), turn: 'CHO' })
    expect(canPass(s)).toBe(false)
    expect(() => pass(s)).toThrow()
  })
})

describe('undoMove', () => {
  it('makeMove 후 undo 하면 원래 국면과 일치한다', () => {
    const before = createInitialState()
    const after = makeMove(before, at(3, 7), at(3, 6))
    const undone = undoMove(after)
    expect(undone.board).toEqual(before.board)
    expect(undone.turn).toBe(before.turn)
    expect(undone.moveHistory).toHaveLength(0)
  })
})
