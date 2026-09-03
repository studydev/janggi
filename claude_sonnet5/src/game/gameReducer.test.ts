import { describe, expect, it } from 'vitest'
import { pieceAt } from '../engine/board'
import { createSession, gameReducer, initialSession, viewedGame, type Action } from './gameReducer'
import { DEFAULT_SETUP } from './session-types'

function fresh() {
  return createSession(DEFAULT_SETUP)
}

function apply(session: ReturnType<typeof fresh>, ...actions: Action[]) {
  return actions.reduce(gameReducer, session)
}

describe('gameReducer', () => {
  it('initialSession 은 설정 단계', () => {
    expect(initialSession().phase).toBe('setup')
  })

  it('SQUARE_CLICK: 내 기물 선택 → 합법 도착지 캐시', () => {
    const s = apply(fresh(), { type: 'SQUARE_CLICK', pos: { file: 1, rank: 7 } })
    expect(s.selected).toEqual({ file: 1, rank: 7 })
    expect(s.legalTargets.length).toBeGreaterThan(0)
  })

  it('SQUARE_CLICK: 선택 후 도착지 클릭 → 착수', () => {
    const s = apply(
      fresh(),
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 7 } },
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 6 } },
    )
    expect(s.game.moveHistory).toHaveLength(1)
    expect(s.game.turn).toBe('HAN')
    expect(pieceAt(s.game.board, { file: 1, rank: 6 })).toEqual({ side: 'CHO', type: 'JOL' })
    expect(s.selected).toBeNull()
  })

  it('SQUARE_CLICK: 상대 기물 클릭은 선택되지 않는다', () => {
    const s = apply(fresh(), { type: 'SQUARE_CLICK', pos: { file: 1, rank: 4 } }) // 한 병
    expect(s.selected).toBeNull()
  })

  it('DRAG_MOVE: 합법 이동이면 착수, 아니면 선택만', () => {
    const ok = apply(fresh(), {
      type: 'DRAG_MOVE',
      from: { file: 3, rank: 7 },
      to: { file: 3, rank: 6 },
    })
    expect(ok.game.moveHistory).toHaveLength(1)

    const bad = apply(fresh(), {
      type: 'DRAG_MOVE',
      from: { file: 3, rank: 7 },
      to: { file: 3, rank: 4 },
    })
    expect(bad.game.moveHistory).toHaveLength(0)
    expect(bad.selected).toEqual({ file: 3, rank: 7 })
  })

  it('PASS 는 차례를 넘기고, UNDO 는 되돌린다', () => {
    const passed = apply(fresh(), { type: 'PASS' })
    expect(passed.game.turn).toBe('HAN')
    expect(passed.game.moveHistory[0].isPass).toBe(true)

    const undone = gameReducer(passed, { type: 'UNDO' })
    expect(undone.game.moveHistory).toHaveLength(0)
    expect(undone.game.turn).toBe('CHO')
  })

  it('RESIGN 은 수동 종료를 남기고 승자를 정한다', () => {
    const s = gameReducer(fresh(), { type: 'RESIGN', side: 'CHO' })
    expect(s.manualOutcome).toEqual({ status: 'RESIGN', winner: 'HAN', reason: '초 기권' })
  })

  it('무승부 제안 → 수락 시 합의 무승부', () => {
    const s = apply(
      fresh(),
      { type: 'OFFER_DRAW', side: 'CHO' },
      { type: 'RESPOND_DRAW', accept: true },
    )
    expect(s.manualOutcome?.status).toBe('DRAW_AGREED')
    expect(s.manualOutcome?.winner).toBeNull()
  })

  it('리플레이: SEEK 하면 viewedGame 이 과거 국면을 돌려준다', () => {
    let s = apply(
      fresh(),
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 7 } },
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 6 } },
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 4 } },
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 5 } },
    )
    expect(s.game.moveHistory).toHaveLength(2)
    s = apply(s, { type: 'REPLAY_ENTER' }, { type: 'REPLAY_SEEK', ply: 0 })
    const past = viewedGame(s)
    expect(past.moveHistory).toHaveLength(0)
    expect(pieceAt(past.board, { file: 1, rank: 7 })).toEqual({ side: 'CHO', type: 'JOL' })
  })

  it('리플레이 중에는 착수가 막힌다', () => {
    let s = apply(
      fresh(),
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 7 } },
      { type: 'SQUARE_CLICK', pos: { file: 1, rank: 6 } },
      { type: 'REPLAY_ENTER' },
    )
    const before = s.game.moveHistory.length
    s = gameReducer(s, { type: 'SQUARE_CLICK', pos: { file: 9, rank: 7 } })
    expect(s.game.moveHistory).toHaveLength(before)
  })
})
