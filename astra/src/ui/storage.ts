import { z } from 'zod'
import { exportGame, importGame } from '../engine/game-record'
import type { LoadedGame } from '../engine/game-record'
import { DEFAULT_PREFERENCES } from './game-state'
import type { MatchState, Preferences } from './game-state'

export const MATCH_KEY = 'astra:match:v1'
export const PREFS_KEY = 'astra:preferences:v1'
export type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export type Recovery = { kind: 'none' } | { kind: 'saved'; saved: LoadedGame }
  | { kind: 'invalid'; raw: string } | { kind: 'unavailable' }

const preferencesSchema = z.object({ notation: z.enum(['hanja', 'hangul']), flipped: z.boolean(), palette: z.enum(['classic', 'accessible']) }).strict()

function browserStorage(): StorageAccess | null {
  try { return typeof window === 'undefined' ? null : window.localStorage }
  catch { return null }
}

export function serializeMatch(state: MatchState): string {
  const reason = state.result.reason
  return exportGame(state.game, state.settings, {
    elapsedMs: state.elapsedMs,
    conclusion: reason === 'AGREEMENT' || reason === 'RESIGNATION' ? reason : null,
  })
}

export function readSavedGame(storage: StorageAccess | null = browserStorage()): Recovery {
  if (!storage) return { kind: 'unavailable' }
  let raw: string | null
  try { raw = storage.getItem(MATCH_KEY) }
  catch { return { kind: 'unavailable' } }
  if (raw === null) return { kind: 'none' }
  try { return { kind: 'saved', saved: importGame(raw) } }
  catch { return { kind: 'invalid', raw } }
}

export function saveMatch(state: MatchState, storage: StorageAccess | null = browserStorage()): string | null {
  if (state.phase === 'setup') return null
  try {
    if (!storage) throw new Error('Storage is unavailable')
    storage.setItem(MATCH_KEY, serializeMatch(state))
    return null
  } catch { return '자동 저장을 사용할 수 없습니다.' }
}

export function clearSavedGame(storage: StorageAccess | null = browserStorage()): string | null {
  try {
    if (!storage) throw new Error('Storage is unavailable')
    storage.removeItem(MATCH_KEY)
    return null
  } catch { return '저장된 대국을 지울 수 없습니다.' }
}

export function readPreferences(storage: StorageAccess | null = browserStorage()): Preferences {
  try {
    const raw = storage?.getItem(PREFS_KEY)
    return raw ? preferencesSchema.parse(JSON.parse(raw)) : DEFAULT_PREFERENCES
  } catch { return DEFAULT_PREFERENCES }
}

export function savePreferences(preferences: Preferences, storage: StorageAccess | null = browserStorage()): string | null {
  try {
    if (!storage) throw new Error('Storage is unavailable')
    storage.setItem(PREFS_KEY, JSON.stringify(preferencesSchema.parse(preferences)))
    return null
  } catch { return '화면 설정을 저장할 수 없습니다.' }
}

export function createPersistenceStatus(initialError: string | null = null) {
  const errors: Record<'match' | 'preferences', string | null> = { match: initialError, preferences: null }
  const listeners = new Set<() => void>()
  const getSnapshot = () => errors.match ?? errors.preferences
  return {
    getSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    report(channel: keyof typeof errors, error: string | null) {
      const previous = getSnapshot()
      errors[channel] = error
      if (previous !== getSnapshot()) for (const listener of listeners) listener()
    },
  }
}