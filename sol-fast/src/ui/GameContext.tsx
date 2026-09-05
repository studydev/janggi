import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { createInitialState, oppositeSide } from '../engine/board'
import { deserializeGame, serializeGame } from '../engine/game-record'
import type { PieceLabelStyle } from '../engine/janggi-notation'
import type { GameResult } from '../engine/result'
import { makeMove, pass, undoMove } from '../engine/rules'
import type { GameState, MoveInput, PieceSetup, Side } from '../engine/types'

export const STORAGE_KEY = 'sol-fast-janggi-current-game-v1'

export interface GamePreferences {
  readonly hanSetup: PieceSetup
  readonly choSetup: PieceSetup
  readonly labelStyle: PieceLabelStyle
  readonly flipped: boolean
  readonly colorBlindMode: boolean
  readonly bikjangEnabled: boolean
}

export interface AppGameState {
  readonly phase: 'SETUP' | 'PLAYING'
  readonly game: GameState | null
  readonly preferences: GamePreferences
  readonly replayPly: number | null
  readonly overrideResult: GameResult | null
  readonly drawOffer: Side | null
  readonly startedAt: number | null
  readonly savedGame: GameState | null
}

type GameAction =
  | { type: 'SET_SETUP'; side: Side; setup: PieceSetup }
  | { type: 'SET_LABEL_STYLE'; style: PieceLabelStyle }
  | { type: 'TOGGLE_FLIP' }
  | { type: 'TOGGLE_COLOR_BLIND' }
  | { type: 'SET_BIKJANG'; enabled: boolean }
  | { type: 'START'; now: number }
  | { type: 'MOVE'; move: MoveInput }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'RESIGN' }
  | { type: 'OFFER_DRAW' }
  | { type: 'ACCEPT_DRAW' }
  | { type: 'DECLINE_DRAW' }
  | { type: 'SET_REPLAY'; ply: number | null }
  | { type: 'LOAD_GAME'; game: GameState; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'DISCARD_RESUME' }
  | { type: 'NEW_GAME' }

const DEFAULT_PREFERENCES: GamePreferences = {
  hanSetup: 'MSMS',
  choSetup: 'MSMS',
  labelStyle: 'HANJA',
  flipped: false,
  colorBlindMode: false,
  bikjangEnabled: true,
}

function readSavedGame(): GameState | null {
  if (typeof window === 'undefined') return null
  const json = window.localStorage.getItem(STORAGE_KEY)
  if (!json) return null
  try {
    return deserializeGame(json)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function createAppState(): AppGameState {
  return {
    phase: 'SETUP',
    game: null,
    preferences: DEFAULT_PREFERENCES,
    replayPly: null,
    overrideResult: null,
    drawOffer: null,
    startedAt: null,
    savedGame: readSavedGame(),
  }
}

function sideName(side: Side): string {
  return side === 'CHO' ? '초' : '한'
}

function gameReducer(state: AppGameState, action: GameAction): AppGameState {
  switch (action.type) {
    case 'SET_SETUP':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.side === 'HAN' ? 'hanSetup' : 'choSetup']: action.setup,
        },
      }
    case 'SET_LABEL_STYLE':
      return { ...state, preferences: { ...state.preferences, labelStyle: action.style } }
    case 'TOGGLE_FLIP':
      return { ...state, preferences: { ...state.preferences, flipped: !state.preferences.flipped } }
    case 'TOGGLE_COLOR_BLIND':
      return {
        ...state,
        preferences: { ...state.preferences, colorBlindMode: !state.preferences.colorBlindMode },
      }
    case 'SET_BIKJANG':
      return {
        ...state,
        preferences: { ...state.preferences, bikjangEnabled: action.enabled },
      }
    case 'START': {
      const game = createInitialState(state.preferences.hanSetup, state.preferences.choSetup, {
        bikjangEnabled: state.preferences.bikjangEnabled,
      })
      return {
        ...state,
        phase: 'PLAYING',
        game,
        replayPly: null,
        overrideResult: null,
        drawOffer: null,
        startedAt: action.now,
        savedGame: null,
      }
    }
    case 'MOVE':
      if (!state.game || state.replayPly !== null || state.overrideResult) return state
      return { ...state, game: makeMove(state.game, action.move), drawOffer: null }
    case 'PASS':
      if (!state.game || state.replayPly !== null || state.overrideResult) return state
      return { ...state, game: pass(state.game), drawOffer: null }
    case 'UNDO':
      if (!state.game || state.game.moveHistory.length === 0) return state
      return {
        ...state,
        game: undoMove(state.game),
        replayPly: null,
        overrideResult: null,
        drawOffer: null,
      }
    case 'RESIGN':
      if (!state.game) return state
      return {
        ...state,
        overrideResult: {
          status: 'RESIGNATION',
          winner: oppositeSide(state.game.turn),
          reason: `${sideName(state.game.turn)} 기권`,
        },
        drawOffer: null,
      }
    case 'OFFER_DRAW':
      return state.game ? { ...state, drawOffer: state.game.turn } : state
    case 'ACCEPT_DRAW':
      return {
        ...state,
        overrideResult: { status: 'AGREED_DRAW', winner: null, reason: '무승부 합의' },
        drawOffer: null,
      }
    case 'DECLINE_DRAW':
      return { ...state, drawOffer: null }
    case 'SET_REPLAY':
      return { ...state, replayPly: action.ply }
    case 'LOAD_GAME':
      return {
        ...state,
        phase: 'PLAYING',
        game: action.game,
        replayPly: null,
        overrideResult: null,
        drawOffer: null,
        startedAt: action.now,
        savedGame: null,
      }
    case 'RESUME':
      if (!state.savedGame) return state
      return {
        ...state,
        phase: 'PLAYING',
        game: state.savedGame,
        replayPly: null,
        overrideResult: null,
        drawOffer: null,
        startedAt: action.now,
        savedGame: null,
      }
    case 'DISCARD_RESUME':
      return { ...state, savedGame: null }
    case 'NEW_GAME':
      return {
        ...createAppState(),
        preferences: state.preferences,
        savedGame: null,
      }
  }
}

interface GameContextValue {
  readonly state: AppGameState
  readonly dispatch: Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createAppState)

  useEffect(() => {
    if (state.phase === 'PLAYING' && state.game) {
      window.localStorage.setItem(STORAGE_KEY, serializeGame(state.game))
    } else if (!state.savedGame) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [state.game, state.phase, state.savedGame])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame must be used inside GameProvider')
  return value
}