import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { gameReducer, initialAppState, type AppState, type GameAction } from './state';

interface GameContextValue { state: AppState; dispatch: Dispatch<GameAction> }

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialAppState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame은 GameProvider 안에서 사용해야 합니다.');
  return context;
}

export { gameReducer, initialAppState } from './state';
export type { AppState, GameAction } from './state';
