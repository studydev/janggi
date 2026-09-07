import { createContext, type Dispatch } from 'react'
import type { AppState, GameAction } from './game-state'

export interface GameContextValue {
  readonly state: AppState
  readonly dispatch: Dispatch<GameAction>
}

export const GameContext = createContext<GameContextValue | null>(null)
