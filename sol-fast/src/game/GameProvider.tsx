import { useEffect, useReducer, type ReactNode } from 'react'
import { serializeGame } from '../engine/game-record'
import { GameContext } from './game-context'
import { gameReducer, initialAppState, SAVE_KEY } from './game-state'

export function GameProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialAppState)

  useEffect(() => {
    if (state.phase !== 'GAME') return
    try {
      localStorage.setItem(SAVE_KEY, serializeGame(state.game))
    } catch {
      // The game remains usable if storage is unavailable.
    }
  }, [state.game, state.phase])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}
