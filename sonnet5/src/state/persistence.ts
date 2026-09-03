// 기보 저장/불러오기: localStorage 자동 저장, JSON 내보내기/가져오기.
import { createInitialGameState, makeMove, pass } from '../engine'
import type { GameConfig, GameState, JinSetup, Move } from '../engine'
import type { AppState, EndReason, MatchSetup } from './gameReducer'
import { liveState } from './gameReducer'

const STORAGE_KEY = 'janggi.sonnet5.autosave.v1'

export interface SavedMatch {
  readonly hanSetup: JinSetup
  readonly choSetup: JinSetup
  readonly config: GameConfig
  readonly moves: readonly Move[]
  readonly endReason: EndReason | null
}

export function serializeMatch(state: AppState): SavedMatch | null {
  if (!state.match || state.states.length === 0) return null
  return {
    hanSetup: state.match.hanSetup,
    choSetup: state.match.choSetup,
    config: state.match.config,
    moves: liveState(state).moveHistory,
    endReason: state.endReason,
  }
}

/** 초기 배치 + 수순 목록으로부터 states 배열 전체를 재구성한다. */
export function replayMoves(hanSetup: JinSetup, choSetup: JinSetup, config: GameConfig, moves: readonly Move[]): GameState[] {
  let current = createInitialGameState(hanSetup, choSetup, config)
  const states: GameState[] = [current]
  for (const move of moves) {
    current = move.isPass ? pass(current) : makeMove(current, move)
    states.push(current)
  }
  return states
}

export function savedMatchToMatchSetup(saved: SavedMatch): MatchSetup {
  return { hanSetup: saved.hanSetup, choSetup: saved.choSetup, config: saved.config }
}

export function saveAutosave(state: AppState): void {
  const saved = serializeMatch(state)
  try {
    if (!saved) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 조용히 무시한다.
  }
}

export function loadAutosave(): SavedMatch | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return validateSavedMatch(JSON.parse(raw))
  } catch {
    return null
  }
}

export function clearAutosave(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 무시
  }
}

function validateSavedMatch(value: unknown): SavedMatch | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (typeof v.hanSetup !== 'string' || typeof v.choSetup !== 'string' || !Array.isArray(v.moves) || !v.config) return null
  return v as unknown as SavedMatch
}

export function exportMatchAsJson(state: AppState): string {
  return JSON.stringify(serializeMatch(state), null, 2)
}

export function parseImportedMatch(json: string): SavedMatch {
  const parsed = validateSavedMatch(JSON.parse(json))
  if (!parsed) throw new Error('올바르지 않은 기보 파일입니다.')
  return parsed
}
