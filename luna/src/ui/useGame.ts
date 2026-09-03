import { useContext } from 'react'
import { GameContext } from './GameContextStore'
import type { GameContextValue } from './GameContext'

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (context === null) throw new Error('useGame must be used inside GameProvider')
  return context
}