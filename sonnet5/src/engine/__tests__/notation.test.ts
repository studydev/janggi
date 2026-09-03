import { describe, expect, it } from 'vitest'
import { formatMove, formatMoveList } from '../notation'
import type { Move } from '../types'

describe('formatMove', () => {
  it('일반 이동을 진영+기물+좌표로 표기한다', () => {
    const move: Move = {
      from: { file: 1, rank: 1 },
      to: { file: 1, rank: 5 },
      piece: { type: 'CHA', side: 'CHO' },
      captured: null,
      isPass: false,
    }
    expect(formatMove(move)).toBe('초차 101→105')
  })

  it('잡는 수는 잡힌 기물 정보를 함께 표기한다', () => {
    const move: Move = {
      from: { file: 1, rank: 1 },
      to: { file: 1, rank: 5 },
      piece: { type: 'CHA', side: 'CHO' },
      captured: { type: 'JOL', side: 'HAN' },
      isPass: false,
    }
    expect(formatMove(move)).toBe('초차 101→105 (한병 잡음)')
  })

  it('패스는 별도 문구로 표기한다', () => {
    const move: Move = {
      from: { file: 5, rank: 2 },
      to: { file: 5, rank: 2 },
      piece: { type: 'GUNG', side: 'HAN' },
      captured: null,
      isPass: true,
    }
    expect(formatMove(move)).toBe('한 한 수 쉬기')
  })

  it('formatMoveList는 순번을 붙여 목록을 만든다', () => {
    const moves: Move[] = [
      { from: { file: 1, rank: 1 }, to: { file: 1, rank: 5 }, piece: { type: 'CHA', side: 'CHO' }, captured: null, isPass: false },
    ]
    expect(formatMoveList(moves)).toEqual(['1. 초차 101→105'])
  })
})
