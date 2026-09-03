import { describe, expect, it } from 'vitest'
import { createInitialGameState, DEFAULT_CONFIG } from '../board'
import { makeMove } from '../rules'
import { calculateScore, getGameResult, getRepetitionCount, isBikjang, isCheckmate } from '../result'
import { generateLegalMoves } from '../rules'
import { makeState, pos, withPieces } from '../testUtils'
import type { Move } from '../types'

describe('calculateScore', () => {
  it('초기 국면에서 초는 72점, 한은 72+1.5=73.5점이다', () => {
    const state = createInitialGameState('MSMS', 'MSMS')
    expect(calculateScore(state, 'CHO')).toBe(72)
    expect(calculateScore(state, 'HAN')).toBe(73.5)
  })
})

describe('isBikjang', () => {
  it('같은 file에 두 궁이 사이 기물 없이 마주보면 빅장이다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 9), { type: 'GUNG', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    expect(isBikjang(state)).toBe(true)
  })

  it('사이에 기물이 있으면 빅장이 아니다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 5), { type: 'JOL', side: 'HAN' }],
      [pos(5, 9), { type: 'GUNG', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    expect(isBikjang(state)).toBe(false)
  })
})

describe('isCheckmate / getGameResult', () => {
  it('탈출·차단·포획이 모두 불가능하면 외통이다', () => {
    const board = withPieces([
      [pos(4, 1), { type: 'GUNG', side: 'HAN' }],
      [pos(4, 5), { type: 'CHA', side: 'CHO' }],
      [pos(5, 5), { type: 'CHA', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN')
    expect(isCheckmate(state)).toBe(true)
    const result = getGameResult(state)
    expect(result.status).toBe('CHECKMATE')
    expect(result.winner).toBe('CHO')
  })
})

describe('빅장 설정 on/off', () => {
  it('bikjangIsDraw=false면 빅장이어도 게임이 계속된다', () => {
    const board = withPieces([
      [pos(5, 2), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 9), { type: 'GUNG', side: 'CHO' }],
    ])
    const state = makeState(board, 'HAN', { ...DEFAULT_CONFIG, bikjangIsDraw: false })
    expect(getGameResult(state).status).toBe('PLAYING')
  })
})

describe('국면 반복 무승부', () => {
  it('설정된 반복 횟수에 도달하면 비김(점수 판정)으로 처리된다', () => {
    const board = withPieces([
      [pos(4, 1), { type: 'GUNG', side: 'HAN' }],
      [pos(5, 10), { type: 'GUNG', side: 'CHO' }],
    ])
    let state = makeState(board, 'HAN', { ...DEFAULT_CONFIG, repetitionLimit: 2 })

    const shuttle = (from: { file: number; rank: number }, to: { file: number; rank: number }) => {
      const move = generateLegalMoves(state).find((m) => m.from.file === from.file && m.from.rank === from.rank && m.to.file === to.file && m.to.rank === to.rank)
      if (!move) throw new Error('예상한 이동을 찾지 못했습니다.')
      state = makeMove(state, move as Move)
    }

    shuttle(pos(4, 1), pos(5, 1)) // 한: (4,1)->(5,1)
    shuttle(pos(5, 10), pos(4, 10)) // 초: (5,10)->(4,10)
    shuttle(pos(5, 1), pos(4, 1)) // 한: 원위치로
    shuttle(pos(4, 10), pos(5, 10)) // 초: 원위치로 -> 최초 국면과 동일(HAN 차례)

    expect(getRepetitionCount(state)).toBe(2)
    expect(getGameResult(state).status).toBe('DRAW_BY_REPETITION')
  })
})
