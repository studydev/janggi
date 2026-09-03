import { createContext } from 'react'
import type { GameContextValue } from './GameContext'

export const GameContext = createContext<GameContextValue | null>(null)