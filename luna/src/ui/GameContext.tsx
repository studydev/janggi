import { useEffect, useReducer, type Dispatch, type PropsWithChildren } from 'react'
import {
  createInitialGameState,
  deserializeGame,
  generateLegalMoves,
  getGameResult,
  getPiece,
  isCheck,
  makeMove,
  pass,
  replayState,
  serializeGame,
} from '../engine'
import type {
  GameConfig,
  GameState,
  HorseElephantSetup,
  Move,
  Position,
  Side,
} from '../engine'
import { GameContext } from './GameContextStore'

export type AppScreen = 'setup' | 'game'

export interface AppState {
  readonly screen: AppScreen
  readonly game: GameState | null
  readonly initialGame: GameState | null
  readonly past: ReadonlyArray<GameState>
  readonly selected: Position | null
  readonly selectedMoves: ReadonlyArray<Move>
  readonly flipped: boolean
  readonly displayKorean: boolean
  readonly drawOffer: Side | null
  readonly drawAccepted: boolean
  readonly resignedBy: Side | null
  readonly startedAt: number | null
  readonly replayIndex: number | null
  readonly restoreCandidate: PersistedSession | null
}

export interface PersistedSession {
  readonly serializedGame: string
  readonly flipped: boolean
  readonly displayKorean: boolean
  readonly drawOffer: Side | null
  readonly drawAccepted: boolean
  readonly resignedBy: Side | null
  readonly startedAt: number | null
}

export type GameAction =
  | { readonly type: 'START_GAME'; readonly hanSetup: HorseElephantSetup; readonly choSetup: HorseElephantSetup; readonly config: GameConfig }
  | { readonly type: 'RESTORE_SESSION' }
  | { readonly type: 'DISMISS_RESTORE' }
  | { readonly type: 'IMPORT_GAME'; readonly serializedGame: string }
  | { readonly type: 'SELECT_POSITION'; readonly position: Position }
  | { readonly type: 'PASS' }
  | { readonly type: 'UNDO' }
  | { readonly type: 'RESIGN' }
  | { readonly type: 'OFFER_DRAW' }
  | { readonly type: 'ACCEPT_DRAW' }
  | { readonly type: 'TOGGLE_FLIP' }
  | { readonly type: 'TOGGLE_LANGUAGE' }
  | { readonly type: 'REPLAY'; readonly index: number }
  | { readonly type: 'EXIT_REPLAY' }
  | { readonly type: 'BACK_TO_SETUP' }

export interface GameContextValue {
  readonly state: AppState
  readonly liveGame: GameState | null
  readonly viewGame: GameState | null
  readonly dispatch: Dispatch<GameAction>
}

const initialAppState: AppState = {
  screen: 'setup',
  game: null,
  initialGame: null,
  past: [],
  selected: null,
  selectedMoves: [],
  flipped: false,
  displayKorean: true,
  drawOffer: null,
  drawAccepted: false,
  resignedBy: null,
  startedAt: null,
  replayIndex: null,
  restoreCandidate: null,
}

const STORAGE_KEY = 'luna-janggi-session'

function loadPersistedSession(): PersistedSession | null {
  if (typeof window === 'undefined') return null
  const serialized = window.localStorage.getItem(STORAGE_KEY)
  if (serialized === null) return null
  try {
    const parsed = JSON.parse(serialized) as Partial<PersistedSession>
    if (typeof parsed.serializedGame !== 'string' || typeof parsed.flipped !== 'boolean' || typeof parsed.displayKorean !== 'boolean') return null
    deserializeGame(parsed.serializedGame)
    return {
      serializedGame: parsed.serializedGame,
      flipped: parsed.flipped,
      displayKorean: parsed.displayKorean,
      drawOffer: parsed.drawOffer === 'HAN' || parsed.drawOffer === 'CHO' ? parsed.drawOffer : null,
      drawAccepted: parsed.drawAccepted === true,
      resignedBy: parsed.resignedBy === 'HAN' || parsed.resignedBy === 'CHO' ? parsed.resignedBy : null,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function initialAppStateWithRestore(): AppState {
  return { ...initialAppState, restoreCandidate: loadPersistedSession() }
}

function samePosition(first: Position | null, second: Position): boolean {
  return first !== null && first.file === second.file && first.rank === second.rank
}

function isFinished(state: AppState): boolean {
  return state.game !== null &&
    (state.resignedBy !== null || state.drawAccepted || getGameResult(state.game).status !== 'PLAYING')
}

function clearSelection(state: AppState): AppState {
  return { ...state, selected: null, selectedMoves: [] }
}

function hydrateGame(game: GameState): Pick<AppState, 'game' | 'initialGame' | 'past'> {
  const initialGame = replayState(game, game.moveHistory, 0)
  const past = game.moveHistory.map((_, index) => replayState(game, game.moveHistory, index))
  return { game, initialGame, past }
}

function reducer(state: AppState, action: GameAction): AppState {
  switch (action.type) {
    case 'START_GAME': {
      const game = createInitialGameState(action.hanSetup, action.choSetup, action.config)
      return {
        ...initialAppState,
        screen: 'game',
        game,
        initialGame: game,
        startedAt: Date.now(),
        restoreCandidate: null,
      }
    }
    case 'RESTORE_SESSION': {
      if (state.restoreCandidate === null) return state
      try {
        const restoredGame = deserializeGame(state.restoreCandidate.serializedGame)
        return {
          ...state,
          ...hydrateGame(restoredGame),
          screen: 'game',
          flipped: state.restoreCandidate.flipped,
          displayKorean: state.restoreCandidate.displayKorean,
          drawOffer: state.restoreCandidate.drawOffer,
          drawAccepted: state.restoreCandidate.drawAccepted,
          resignedBy: state.restoreCandidate.resignedBy,
          startedAt: state.restoreCandidate.startedAt ?? Date.now(),
          restoreCandidate: null,
        }
      } catch {
        return { ...state, restoreCandidate: null }
      }
    }
    case 'DISMISS_RESTORE':
      if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
      return { ...state, restoreCandidate: null }
    case 'IMPORT_GAME': {
      try {
        const importedGame = deserializeGame(action.serializedGame)
        const hydrated = hydrateGame(importedGame)
        return {
          ...state,
          ...hydrated,
          screen: 'game',
          selected: null,
          selectedMoves: [],
          drawOffer: null,
          drawAccepted: false,
          resignedBy: null,
          replayIndex: null,
          startedAt: Date.now(),
          restoreCandidate: null,
        }
      } catch {
        return state
      }
    }
    case 'SELECT_POSITION': {
      const game = state.game
      if (game === null || state.replayIndex !== null || isFinished(state)) return state
      const selectedMove = state.selectedMoves.find((move) => samePosition(move.to, action.position))
      if (selectedMove !== undefined) {
        const nextGame = makeMove(game, selectedMove)
        return {
          ...state,
          game: nextGame,
          past: [...state.past, game],
          selected: null,
          selectedMoves: [],
          drawOffer: null,
        }
      }
      const clickedPiece = getPiece(game.board, action.position)
      if (clickedPiece?.side === game.turn) {
        const legalMoves = generateLegalMoves(game).filter((move) => samePosition(move.from, action.position))
        return { ...state, selected: action.position, selectedMoves: legalMoves }
      }
      return clearSelection(state)
    }
    case 'PASS': {
      const game = state.game
      if (game === null || state.replayIndex !== null || isFinished(state) || isCheck(game, game.turn)) return state
      const nextGame = pass(game)
      return {
        ...state,
        game: nextGame,
        past: [...state.past, game],
        selected: null,
        selectedMoves: [],
        drawOffer: null,
      }
    }
    case 'UNDO': {
      if (state.past.length === 0 || state.replayIndex !== null) return state
      const previous = state.past[state.past.length - 1]
      return {
        ...state,
        game: previous,
        past: state.past.slice(0, -1),
        selected: null,
        selectedMoves: [],
        drawOffer: null,
        drawAccepted: false,
        resignedBy: null,
      }
    }
    case 'RESIGN':
      if (state.game === null || state.replayIndex !== null || isFinished(state)) return state
      return { ...state, resignedBy: state.game.turn, selected: null, selectedMoves: [] }
    case 'OFFER_DRAW': {
      const game = state.game
      if (game === null || state.replayIndex !== null || isFinished(state)) return state
      if (state.drawOffer !== null && state.drawOffer !== game.turn) return { ...state, drawAccepted: true, drawOffer: null }
      return { ...state, drawOffer: game.turn }
    }
    case 'ACCEPT_DRAW':
      if (state.game === null || state.drawOffer === null || state.drawOffer === state.game.turn) return state
      return { ...state, drawAccepted: true, drawOffer: null }
    case 'TOGGLE_FLIP':
      return { ...state, flipped: !state.flipped }
    case 'TOGGLE_LANGUAGE':
      return { ...state, displayKorean: !state.displayKorean }
    case 'REPLAY':
      if (state.game === null || action.index < 0 || action.index > state.game.moveHistory.length) return state
      return { ...clearSelection(state), replayIndex: action.index }
    case 'EXIT_REPLAY':
      return { ...state, replayIndex: null }
    case 'BACK_TO_SETUP':
      return { ...initialAppState, displayKorean: state.displayKorean, flipped: state.flipped }
    default:
      return state
  }
}

export function GameProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialAppState, initialAppStateWithRestore)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (state.game === null) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    const persisted: PersistedSession = {
      serializedGame: serializeGame(state.game),
      flipped: state.flipped,
      displayKorean: state.displayKorean,
      drawOffer: state.drawOffer,
      drawAccepted: state.drawAccepted,
      resignedBy: state.resignedBy,
      startedAt: state.startedAt,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }, [state.game, state.flipped, state.displayKorean, state.drawOffer, state.drawAccepted, state.resignedBy, state.startedAt])
  const liveGame = state.game
  const viewGame = liveGame === null
    ? null
    : state.replayIndex === null
      ? liveGame
      : replayState(liveGame, liveGame.moveHistory, state.replayIndex)
  return <GameContext.Provider value={{ state, liveGame, viewGame, dispatch }}>{children}</GameContext.Provider>
}
