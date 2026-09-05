import { useEffect, useReducer, useState, useSyncExternalStore } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { createMatch, gameReducer, isLive } from './game-state'
import type { GameAction } from './game-state'
import { clearSavedGame, createPersistenceStatus, readPreferences, readSavedGame, saveMatch, savePreferences } from './storage'
import type { Recovery } from './storage'
import { GameContext } from './game-context'

export function GameProvider({ children }: { children: ReactNode }) {
  const [recovery, setRecovery] = useState<Recovery>(() => readSavedGame())
  const [persistence] = useState(() => createPersistenceStatus(recovery.kind === 'unavailable' ? '자동 저장을 사용할 수 없습니다.' : null))
  const storageError = useSyncExternalStore(persistence.subscribe, persistence.getSnapshot, persistence.getSnapshot)
  const [state, rawDispatch] = useReducer(gameReducer, undefined, () => createMatch(undefined, readPreferences()))
  const pendingRecovery = recovery.kind === 'saved' || recovery.kind === 'invalid'
  const ticking = isLive(state) && !pendingRecovery

  const dispatch: Dispatch<GameAction> = (action) => {
    if (action.type === 'NEW') persistence.report('match', clearSavedGame())
    rawDispatch(action)
  }

  useEffect(() => {
    if (!pendingRecovery && state.phase === 'playing') persistence.report('match', saveMatch(state))
  }, [state, pendingRecovery, persistence])

  useEffect(() => { persistence.report('preferences', savePreferences(state.preferences)) }, [state.preferences, persistence])

  useEffect(() => {
    if (!ticking) return
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      rawDispatch({ type: 'TICK', milliseconds: now - last })
      last = now
    }, 1000)
    return () => window.clearInterval(timer)
  }, [ticking])

  function restoreSaved() {
    if (recovery.kind === 'saved') rawDispatch({ type: 'LOAD', saved: recovery.saved })
    setRecovery({ kind: 'none' })
  }

  function discardSaved() {
    persistence.report('match', clearSavedGame())
    setRecovery({ kind: 'none' })
    rawDispatch({ type: 'NEW' })
  }

  return <GameContext.Provider value={{ state, dispatch, recovery, storageError,
    restoreSaved, discardSaved, dismissRecovery: () => setRecovery({ kind: 'none' }) }}>{children}</GameContext.Provider>
}