/**
 * localStorage 자동 저장/복구 + 대국 JSON 내보내기/불러오기.
 */

import { replayHistory } from '../engine/rules'
import type { GameConfig, Move } from '../engine/types'
import { createSession } from './gameReducer'
import { DEFAULT_STYLE_OPTIONS, type Session } from './session-types'

const AUTOSAVE_KEY = 'janggi.autosave.v1'
const SCHEMA = 2

// --- 자동 저장 ---------------------------------------------------------

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ schema: SCHEMA, session }))
  } catch {
    /* 사생활 모드 등 — 무시 */
  }
}

export function clearSavedSession(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
  } catch {
    /* 무시 */
  }
}

/** 저장된 세션 (복구할 만한 경우에만). 없거나 손상되면 null. */
export function loadSavedSession(): Session | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  try {
    const parsed = JSON.parse(raw) as { schema?: number; session?: unknown }
    if (parsed.schema !== SCHEMA || parsed.session == null) return null
    const session = parsed.session as Session
    if (session.phase !== 'playing') return null
    // 엔진 상태 무결성 확인: 기록을 재생해 보드가 일치하는가.
    const replayed = replayHistory(session.game.config, session.game.moveHistory)
    if (JSON.stringify(replayed.board) !== JSON.stringify(session.game.board)) return null
    return {
      ...session,
      options: { ...DEFAULT_STYLE_OPTIONS, ...session.options },
      selected: null,
      legalTargets: [],
    }
  } catch {
    return null
  }
}

// --- 대국 파일 (내보내기/불러오기) -----------------------------------

export interface GameRecord {
  readonly app: 'janggi-claude-sonnet5'
  readonly schema: number
  readonly savedAt: string
  readonly config: GameConfig
  readonly moves: readonly Move[]
}

export function toGameRecord(session: Session): GameRecord {
  return {
    app: 'janggi-claude-sonnet5',
    schema: SCHEMA,
    savedAt: new Date().toISOString(),
    config: session.game.config,
    moves: session.game.moveHistory,
  }
}

export function gameRecordToJson(record: GameRecord): string {
  return JSON.stringify(record, null, 2)
}

export function parseGameRecord(json: string): GameRecord {
  const parsed = JSON.parse(json) as Partial<GameRecord>
  if (parsed.app !== 'janggi-claude-sonnet5' || !Array.isArray(parsed.moves) || parsed.config == null) {
    throw new Error('알 수 없는 대국 파일 형식입니다.')
  }
  return parsed as GameRecord
}

/** 대국 기록 → 재생된 세션 (리플레이 시작 상태). */
export function sessionFromRecord(record: GameRecord): Session {
  const session = createSession({
    hanFormation: record.config.hanFormation,
    choFormation: record.config.choFormation,
    mode: 'LOCAL_2P',
    bikjangDraw: record.config.bikjangDraw,
    repetitionLimit: record.config.repetitionLimit,
  })
  return {
    ...session,
    game: replayHistory(record.config, record.moves),
    replay: { active: true, ply: record.moves.length },
  }
}
