import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { GameAction, MatchState } from './game-state'
import type { Recovery } from './storage'

export const GameContext = createContext<{
  state: MatchState
  dispatch: Dispatch<GameAction>
  recovery: Recovery
  storageError: string | null
  restoreSaved: () => void
  discardSaved: () => void
  dismissRecovery: () => void
} | null>(null)

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('GameProvider is missing')
  return context
}