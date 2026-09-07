import { createInitialState, oppositeSide } from '../engine/board'
import { getGameResult } from '../engine/result'
import { makeMove, passTurn, undoMove } from '../engine/rules'
import type {
  Formation,
  GameConfig,
  GameResult,
  GameSetup,
  GameState,
  Move,
  Side,
} from '../engine/types'

export const SAVE_KEY = 'du-neun-janggi:autosave:v1'

export type LabelMode = 'HANJA' | 'HANGUL'

export interface AppState {
  readonly phase: 'SETUP' | 'GAME'
  readonly game: GameState
  readonly result: GameResult
  readonly replayIndex: number | null
  readonly drawOfferBy: Side | null
  readonly startedAt: number
  readonly labelMode: LabelMode
  readonly flipped: boolean
  readonly colorBlind: boolean
}

export type GameAction =
  | { readonly type: 'START'; readonly setup: GameSetup; readonly config: GameConfig; readonly now: number }
  | { readonly type: 'RESTORE'; readonly game: GameState; readonly now: number }
  | { readonly type: 'MOVE'; readonly move: Move }
  | { readonly type: 'PASS' }
  | { readonly type: 'UNDO' }
  | { readonly type: 'RESIGN' }
  | { readonly type: 'OFFER_DRAW' }
  | { readonly type: 'ACCEPT_DRAW' }
  | { readonly type: 'DECLINE_DRAW' }
  | { readonly type: 'SET_REPLAY'; readonly index: number | null }
  | { readonly type: 'SET_LABEL_MODE'; readonly mode: LabelMode }
  | { readonly type: 'TOGGLE_FLIP' }
  | { readonly type: 'TOGGLE_COLOR_BLIND' }
  | { readonly type: 'NEW_GAME' }

const initialGame = createInitialState()

export const initialAppState: AppState = {
  phase: 'SETUP',
  game: initialGame,
  result: getGameResult(initialGame),
  replayIndex: null,
  drawOfferBy: null,
  startedAt: 0,
  labelMode: 'HANJA',
  flipped: false,
  colorBlind: false,
}

function withGame(state: AppState, game: GameState): AppState {
  return {
    ...state,
    game,
    result: getGameResult(game),
    replayIndex: null,
    drawOfferBy: null,
  }
}

export function gameReducer(state: AppState, action: GameAction): AppState {
  switch (action.type) {
    case 'START': {
      const game = createInitialState(action.setup, action.config)
      return {
        ...state,
        phase: 'GAME',
        game,
        result: getGameResult(game),
        replayIndex: null,
        drawOfferBy: null,
        startedAt: action.now,
      }
    }
    case 'RESTORE':
      return {
        ...state,
        phase: 'GAME',
        game: action.game,
        result: getGameResult(action.game),
        replayIndex: null,
        drawOfferBy: null,
        startedAt: action.now,
      }
    case 'MOVE':
      if (state.replayIndex !== null || state.result.status !== 'PLAYING') return state
      return withGame(state, makeMove(state.game, action.move))
    case 'PASS':
      if (state.replayIndex !== null || state.result.status !== 'PLAYING') return state
      return withGame(state, passTurn(state.game))
    case 'UNDO':
      return {
        ...withGame(state, undoMove(state.game)),
        result: { status: 'PLAYING', winner: null, reason: '' },
      }
    case 'RESIGN':
      if (state.result.status !== 'PLAYING') return state
      return {
        ...state,
        result: {
          status: 'RESIGNED',
          winner: oppositeSide(state.game.turn),
          reason: `${state.game.turn === 'HAN' ? '한' : '초'} 기권`,
        },
        drawOfferBy: null,
      }
    case 'OFFER_DRAW':
      if (state.result.status !== 'PLAYING') return state
      return { ...state, drawOfferBy: state.game.turn }
    case 'ACCEPT_DRAW':
      if (!state.drawOfferBy || state.result.status !== 'PLAYING') return state
      return {
        ...state,
        result: { status: 'DRAW_AGREED', winner: null, reason: '합의 무승부' },
        drawOfferBy: null,
      }
    case 'DECLINE_DRAW':
      return { ...state, drawOfferBy: null }
    case 'SET_REPLAY':
      if (action.index === null) return { ...state, replayIndex: null }
      return {
        ...state,
        replayIndex: Math.max(
          0,
          Math.min(state.game.moveHistory.length, Math.trunc(action.index)),
        ),
      }
    case 'SET_LABEL_MODE':
      return { ...state, labelMode: action.mode }
    case 'TOGGLE_FLIP':
      return { ...state, flipped: !state.flipped }
    case 'TOGGLE_COLOR_BLIND':
      return { ...state, colorBlind: !state.colorBlind }
    case 'NEW_GAME':
      return {
        ...initialAppState,
        labelMode: state.labelMode,
        colorBlind: state.colorBlind,
      }
  }
}

export const FORMATION_OPTIONS: ReadonlyArray<{
  readonly value: Formation
  readonly label: string
  readonly pieces: string
}> = [
  { value: 'MSMS', label: '마상마상', pieces: '馬 象 馬 象' },
  { value: 'SMSM', label: '상마상마', pieces: '象 馬 象 馬' },
  { value: 'MSSM', label: '마상상마', pieces: '馬 象 象 馬' },
  { value: 'SMMS', label: '상마마상', pieces: '象 馬 馬 象' },
]
