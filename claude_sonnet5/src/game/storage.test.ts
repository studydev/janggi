import { describe, expect, it } from 'vitest'
import { createSession } from './gameReducer'
import { gameReducer } from './gameReducer'
import { DEFAULT_SETUP } from './session-types'
import { gameRecordToJson, parseGameRecord, sessionFromRecord, toGameRecord } from './storage'

describe('대국 기록 내보내기/불러오기', () => {
  it('세션 → 기록 → JSON → 기록 → 세션 왕복 시 같은 국면', () => {
    let s = createSession(DEFAULT_SETUP)
    s = gameReducer(s, { type: 'DRAG_MOVE', from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } })
    s = gameReducer(s, { type: 'DRAG_MOVE', from: { file: 1, rank: 4 }, to: { file: 1, rank: 5 } })

    const json = gameRecordToJson(toGameRecord(s))
    const record = parseGameRecord(json)
    const restored = sessionFromRecord(record)

    expect(restored.game.board).toEqual(s.game.board)
    expect(restored.game.turn).toBe(s.game.turn)
    expect(restored.game.moveHistory).toHaveLength(2)
    expect(restored.replay.active).toBe(true)
  })

  it('알 수 없는 형식은 거부', () => {
    expect(() => parseGameRecord('{"foo":1}')).toThrow()
    expect(() => parseGameRecord('not json')).toThrow()
  })
})
