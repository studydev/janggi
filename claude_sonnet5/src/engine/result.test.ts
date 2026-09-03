import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { at, scene } from './testkit'
import {
  calculateScore,
  getGameResult,
  isBikjang,
  isCheckmate,
  isRepetitionDraw,
  mustPass,
  repetitionCount,
} from './result'
import { makeMove } from './rules'
import type { GameState } from './types'

function withBoard(board: ReturnType<typeof scene>, turn: 'CHO' | 'HAN', config = {}): GameState {
  return { ...createInitialState(config), board, turn }
}

describe('isCheckmate', () => {
  it('두 차가 궁을 몰아 외통', () => {
    // 초 궁 (4,10). 한 차 file4 → 장군. 한 차 file5 → 도피처 (5,10)/(5,9) 봉쇄.
    const board = scene({ '4,10': 'cK', '4,1': 'hR', '5,1': 'hR', '6,2': 'hK' })
    const s = withBoard(board, 'CHO')
    expect(isCheckmate(s, 'CHO')).toBe(true)
    const r = getGameResult(s)
    expect(r.status).toBe('CHECKMATE')
    expect(r.winner).toBe('HAN')
  })

  it('장군을 피할 수 있으면 외통이 아니다', () => {
    const board = scene({ '5,10': 'cK', '5,1': 'hR', '6,2': 'hK' })
    const s = withBoard(board, 'CHO')
    expect(isCheckmate(s, 'CHO')).toBe(false)
  })
})

describe('mustPass (스테일메이트 아님 — 한 수 쉬기)', () => {
  it('장군은 아니지만 둘 수가 없으면 반드시 쉰다', () => {
    const board = scene({
      '5,9': 'cK',
      '4,1': 'hR',
      '6,1': 'hR',
      '9,8': 'hR',
      '9,10': 'hR',
      '5,2': 'hK',
    })
    const s = withBoard(board, 'CHO', { bikjangDraw: false })
    expect(mustPass(s)).toBe(true)
    expect(isCheckmate(s, 'CHO')).toBe(false)
    expect(getGameResult(s).status).toBe('PLAYING')
  })
})

describe('isBikjang', () => {
  it('양 궁이 열린 file 에서 마주보면 빅장', () => {
    const board = scene({ '5,2': 'hK', '5,9': 'cK' })
    expect(isBikjang(withBoard(board, 'CHO'))).toBe(true)
  })

  it('사이에 기물이 있으면 빅장이 아니다', () => {
    const board = scene({ '5,2': 'hK', '5,5': 'cJ', '5,9': 'cK' })
    expect(isBikjang(withBoard(board, 'CHO'))).toBe(false)
  })

  it('다른 file 이면 빅장이 아니다', () => {
    const board = scene({ '4,2': 'hK', '5,9': 'cK' })
    expect(isBikjang(withBoard(board, 'CHO'))).toBe(false)
  })

  it('config 로 빅장 무승부를 끌 수 있다', () => {
    const board = scene({ '5,2': 'hK', '5,9': 'cK', '1,1': 'hR' })
    expect(getGameResult(withBoard(board, 'CHO', { bikjangDraw: true })).status).toBe('BIKJANG')
    expect(getGameResult(withBoard(board, 'CHO', { bikjangDraw: false })).status).toBe('PLAYING')
  })

  it('빅장 무승부는 점수가 높은 쪽이 승리', () => {
    // 한이 차 하나 더 → 점수 우위.
    const board = scene({ '5,2': 'hK', '5,9': 'cK', '1,1': 'hR' })
    const r = getGameResult(withBoard(board, 'CHO', { bikjangDraw: true }))
    expect(r.status).toBe('BIKJANG')
    expect(r.winner).toBe('HAN')
  })
})

describe('calculateScore', () => {
  it('초기 국면: 초 72, 한 73.5 (덤 1.5)', () => {
    const s = createInitialState()
    expect(calculateScore(s.board, 'CHO')).toBe(72)
    expect(calculateScore(s.board, 'HAN')).toBe(73.5)
  })

  it('기물을 잃으면 점수가 준다', () => {
    const board = scene({ '5,9': 'cK', '5,5': 'cR', '1,1': 'hK' })
    expect(calculateScore(board, 'CHO')).toBe(13) // 궁 0 + 차 13
    expect(calculateScore(board, 'HAN')).toBe(1.5) // 궁 0 + 덤
  })
})

describe('국면 반복', () => {
  it('궁을 왕복시켜 같은 국면이 repetitionLimit 회 나오면 무승부', () => {
    // 초·한이 각각 궁만 좌우로 왕복 → 4수마다 같은 국면. (빅장 판정과 겹치지
    // 않도록 궁을 file 4↔6 사이로 옮기고 빅장은 끈다.)
    let s = createInitialState({ repetitionLimit: 3, bikjangDraw: false })
    s = { ...s, board: scene({ '5,2': 'hK', '5,9': 'cK', '1,1': 'cR', '9,10': 'hR' }), turn: 'CHO' }
    const cycle: [[number, number], [number, number]][] = [
      [[5, 9], [6, 9]],
      [[5, 2], [6, 2]],
      [[6, 9], [5, 9]],
      [[6, 2], [5, 2]],
    ]
    // 초기 국면 1회. 2바퀴 더 돌면 3회.
    for (let round = 0; round < 2; round += 1) {
      for (const [from, to] of cycle) {
        s = makeMove(s, at(from[0], from[1]), at(to[0], to[1]))
      }
    }
    expect(repetitionCount(s)).toBeGreaterThanOrEqual(3)
    expect(isRepetitionDraw(s)).toBe(true)
    expect(getGameResult(s).status).toBe('REPETITION')
  })
})
