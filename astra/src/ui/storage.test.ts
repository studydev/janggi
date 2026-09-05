import { describe, expect, it } from 'vitest'
import { createMatch, gameReducer } from './game-state'
import { clearSavedGame, createPersistenceStatus, MATCH_KEY, PREFS_KEY, readPreferences, readSavedGame, saveMatch, savePreferences } from './storage'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

describe('local persistence', () => {
  it('publishes only changes to the external persistence status', () => {
    const status = createPersistenceStatus()
    let notifications = 0
    const unsubscribe = status.subscribe(() => { notifications += 1 })
    status.report('match', null)
    expect(notifications).toBe(0)
    status.report('match', 'quota')
    status.report('match', 'quota')
    status.report('preferences', 'denied')
    expect(notifications).toBe(1)
    expect(status.getSnapshot()).toBe('quota')
    status.report('match', null)
    expect(status.getSnapshot()).toBe('denied')
    expect(notifications).toBe(2)
    unsubscribe()
    status.report('preferences', null)
    expect(notifications).toBe(2)
  })

  it('recovers a saved game by replaying its record', () => {
    const storage = memoryStorage()
    let state = gameReducer(createMatch(), { type: 'START' })
    state = gameReducer(state, { type: 'PASS' })
    state = gameReducer(state, { type: 'TICK', milliseconds: 2000 })
    expect(saveMatch(state, storage)).toBe(null)
    const recovery = readSavedGame(storage)
    expect(recovery.kind).toBe('saved')
    if (recovery.kind !== 'saved') throw new Error('Missing recovery')
    expect(recovery.saved.game).toEqual(state.game)
    expect(recovery.saved.elapsedMs).toBe(2000)
    const loaded = gameReducer(createMatch(), { type: 'LOAD', saved: recovery.saved })
    expect(loaded.phase).toBe('playing')
    expect(loaded.game).toEqual(state.game)
  })
  it('does not overwrite a saved game with an initial setup preview', () => {
    const storage = memoryStorage()
    storage.setItem(MATCH_KEY, 'existing-game')
    saveMatch(createMatch(), storage)
    expect(storage.getItem(MATCH_KEY)).toBe('existing-game')
  })
  it('reports corrupt saves without deleting them', () => {
    const storage = memoryStorage()
    storage.setItem(MATCH_KEY, '{bad json')
    expect(readSavedGame(storage).kind).toBe('invalid')
    expect(storage.getItem(MATCH_KEY)).toBe('{bad json')
  })
  it('handles denied storage and quota errors without throwing', () => {
    const denied = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('quota') },
      removeItem: () => { throw new Error('denied') },
    }
    const state = gameReducer(createMatch(), { type: 'START' })
    expect(readSavedGame(denied).kind).toBe('unavailable')
    expect(saveMatch(state, denied)).toEqual(expect.any(String))
    expect(clearSavedGame(denied)).toEqual(expect.any(String))
  })
  it('validates display preferences and removes only its own save key', () => {
    const storage = memoryStorage()
    const preferences = { notation: 'hangul', palette: 'accessible', flipped: true } as const
    expect(savePreferences(preferences, storage)).toBe(null)
    expect(readPreferences(storage)).toEqual(preferences)
    storage.setItem('other-app', 'preserved')
    storage.setItem(MATCH_KEY, 'old')
    expect(clearSavedGame(storage)).toBe(null)
    expect(storage.getItem('other-app')).toBe('preserved')
    storage.setItem(PREFS_KEY, '{"notation":"invalid"}')
    expect(readPreferences(storage).notation).toBe('hanja')
  })
})