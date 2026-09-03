import { describe, expect, it } from 'vitest'
import type { Move } from '../engine/types'
import {
  describeMove,
  describeMoveVerbose,
  describeMoveWithCapture,
  formatMoveList,
  formatSquare,
  PASS_TEXT,
} from './janggi-notation'

const move = (from: [number, number], to: [number, number], captured: Move['captured'] = null): Move => ({
  from: { file: from[0], rank: from[1] },
  to: { file: to[0], rank: to[1] },
  piece: { side: 'CHO', type: 'JOL' },
  captured,
  isPass: false,
})

describe('janggi-notation', () => {
  it('formatSquare 는 rank 10 도 모호하지 않다', () => {
    expect(formatSquare({ file: 1, rank: 7 })).toBe('1·7')
    expect(formatSquare({ file: 5, rank: 10 })).toBe('5·10')
  })

  it('describeMove: 출발좌표 기물명 도착좌표', () => {
    expect(describeMove(move([1, 7], [1, 6]))).toBe('1·7 졸 1·6')
  })

  it('한 병은 "병"으로 표기된다', () => {
    const hanJol: Move = {
      from: { file: 1, rank: 4 },
      to: { file: 1, rank: 5 },
      piece: { side: 'HAN', type: 'JOL' },
      captured: null,
      isPass: false,
    }
    expect(describeMove(hanJol)).toBe('1·4 병 1·5')
  })

  it('pass 는 "한 수 쉬기"', () => {
    const pass: Move = { from: null, to: null, piece: null, captured: null, isPass: true }
    expect(describeMove(pass)).toBe(PASS_TEXT)
    expect(describeMoveVerbose(pass)).toBe(PASS_TEXT)
  })

  it('describeMoveWithCapture 는 잡은 기물을 덧붙인다', () => {
    const m = move([2, 6], [2, 3], { side: 'HAN', type: 'PO' })
    expect(describeMoveWithCapture(m)).toBe('2·6 졸 2·3 (포 잡음)')
  })

  it('describeMoveVerbose 는 스크린리더용 문장', () => {
    expect(describeMoveVerbose(move([1, 7], [1, 6]))).toBe('초 졸, 1열 7행에서 1열 6행(으)로')
  })

  it('formatMoveList 는 번호를 붙인다', () => {
    const list = formatMoveList([move([1, 7], [1, 6]), move([3, 7], [3, 6])])
    expect(list).toEqual(['1. 1·7 졸 1·6', '2. 3·7 졸 3·6'])
  })
})
