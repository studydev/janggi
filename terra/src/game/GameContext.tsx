import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { createInitialState, oppositeSide, samePosition } from '../engine/board'
import { getGameResult, resolveScoreDraw } from '../engine/result'
import { generateLegalMoves, isCheck, makeMove, pass, stateAtMove, undoMove } from '../engine/rules'
import type { GameConfig, GameState, Move, Position, Side } from '../engine/types'
import { clearSavedSession, loadSavedSession, parseSession, saveSession } from './storage'
import type { PersistedSession, SessionResult, SessionState } from './session-types'

export interface GameContextValue {
  session: SessionState
  viewState: GameState
  legalMoves: readonly Move[]
  selectedMoves: readonly Move[]
  checkedSide: Side | null
  canInteract: boolean
  startGame: (config: GameConfig) => void
  returnToSetup: () => void
  restoreSavedGame: () => void
  discardSavedGame: () => void
  activatePosition: (position: Position) => void
  requestMove: (from: Position, to: Position) => void
  deselect: () => void
  passTurn: () => void
  undo: () => void
  resign: () => void
  offerDraw: () => void
  answerDraw: (accepted: boolean) => void
  reopenResult: () => void
  setReplayIndex: (index: number) => void
  toggleBoard: () => void
  toggleColorBlindMode: () => void
  togglePieceLabels: () => void
  exportGame: () => string
  importGame: (serialized: string) => boolean
}

const GameContext = createContext<GameContextValue | null>(null)

type Action =
  | { type: 'START'; config: GameConfig }
  | { type: 'SETUP' }
  | { type: 'RESTORE'; session: PersistedSession }
  | { type: 'DISCARD_RESTORE' }
  | { type: 'ACTIVATE_POSITION'; position: Position }
  | { type: 'REQUEST_MOVE'; from: Position; to: Position }
  | { type: 'DESELECT' }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'RESIGN' }
  | { type: 'OFFER_DRAW' }
  | { type: 'ANSWER_DRAW'; accepted: boolean }
  | { type: 'REOPEN_RESULT' }
  | { type: 'SET_REPLAY'; index: number }
  | { type: 'TOGGLE_BOARD' }
  | { type: 'TOGGLE_COLOR_BLIND_MODE' }
  | { type: 'TOGGLE_PIECE_LABELS' }
  | { type: 'IMPORT'; session: PersistedSession }
  | { type: 'TICK' }

function initialSession(): SessionState {
  return {
    screen: 'SETUP',
    game: createInitialState(),
    selected: null,
    replayIndex: null,
    elapsed: { HAN: 0, CHO: 0 },
    flipped: false,
    colorBlindMode: false,
    useKoreanLabels: false,
    result: null,
    resultSeen: false,
    drawOfferBy: null,
    restoreCandidate: loadSavedSession(),
  }
}

function toSessionResult(game: GameState): SessionResult | null {
  const result = getGameResult(game)
  return result.status === 'PLAYING' ? null : result
}

function canAct(state: SessionState): boolean {
  return state.screen === 'GAME' && state.replayIndex === null && state.result === null
}

function findMove(game: GameState, from: Position, to: Position): Move | undefined {
  return generateLegalMoves(game).find(
    (move) => move.from !== null && move.to !== null && samePosition(move.from, from) && samePosition(move.to, to),
  )
}

function completeMove(state: SessionState, move: Move): SessionState {
  const game = makeMove(state.game, move)
  const result = toSessionResult(game)
  return {
    ...state,
    game,
    selected: null,
    drawOfferBy: null,
    result,
    resultSeen: result === null ? state.resultSeen : false,
  }
}

function replayGame(game: GameState, moveCount: number): GameState {
  try {
    return stateAtMove(game, moveCount)
  } catch {
    // Corrupted or partial record — fall back to the live position rather than
    // crashing the board.
    return game
  }
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        screen: 'GAME',
        game: createInitialState(action.config),
        selected: null,
        replayIndex: null,
        elapsed: { HAN: 0, CHO: 0 },
        result: null,
        resultSeen: false,
        drawOfferBy: null,
        restoreCandidate: null,
      }
    case 'SETUP':
      return { ...state, screen: 'SETUP', selected: null, replayIndex: null, drawOfferBy: null }
    case 'RESTORE':
      return {
        ...state,
        screen: 'GAME',
        game: action.session.game,
        selected: null,
        replayIndex: null,
        elapsed: action.session.elapsed,
        flipped: action.session.flipped,
        colorBlindMode: action.session.colorBlindMode,
        useKoreanLabels: action.session.useKoreanLabels,
        result: action.session.result,
        resultSeen: false,
        drawOfferBy: null,
        restoreCandidate: null,
      }
    case 'DISCARD_RESTORE':
      return { ...state, restoreCandidate: null }
    case 'ACTIVATE_POSITION': {
      if (!canAct(state)) {
        return state
      }
      if (state.selected !== null) {
        const move = findMove(state.game, state.selected, action.position)
        if (move !== undefined) {
          return completeMove(state, move)
        }
      }
      const hasLegalMove = generateLegalMoves(state.game).some(
        (move) => move.from !== null && samePosition(move.from, action.position),
      )
      return { ...state, selected: hasLegalMove ? action.position : null }
    }
    case 'REQUEST_MOVE': {
      if (!canAct(state)) {
        return state
      }
      const move = findMove(state.game, action.from, action.to)
      return move === undefined ? { ...state, selected: null } : completeMove(state, move)
    }
    case 'DESELECT':
      return state.selected === null ? state : { ...state, selected: null }
    case 'PASS': {
      if (!canAct(state)) {
        return state
      }
      try {
        const game = pass(state.game)
        const result = toSessionResult(game)
        return { ...state, game, selected: null, result, resultSeen: result === null ? state.resultSeen : false }
      } catch {
        return state
      }
    }
    case 'UNDO': {
      if (!canAct(state) || state.game.moveHistory.length === 0) {
        return state
      }
      return {
        ...state,
        game: undoMove(state.game),
        selected: null,
        result: null,
        resultSeen: false,
        drawOfferBy: null,
      }
    }
    case 'RESIGN':
      if (!canAct(state)) {
        return state
      }
      return {
        ...state,
        selected: null,
        drawOfferBy: null,
        result: { status: 'RESIGNED', winner: oppositeSide(state.game.turn), reason: '기권' },
        resultSeen: false,
      }
    case 'OFFER_DRAW':
      return canAct(state) ? { ...state, drawOfferBy: state.game.turn } : state
    case 'ANSWER_DRAW':
      if (state.drawOfferBy === null) {
        return state
      }
      return action.accepted
        ? {
            ...state,
            selected: null,
            drawOfferBy: null,
            result: resolveScoreDraw(state.game, '무승부 합의'),
            resultSeen: false,
          }
        : { ...state, drawOfferBy: null }
    case 'REOPEN_RESULT':
      return { ...state, replayIndex: null, resultSeen: false }
    case 'SET_REPLAY': {
      if (state.screen !== 'GAME') {
        return state
      }
      const clampedIndex = Math.max(0, Math.min(action.index, state.game.moveHistory.length))
      const atLive = clampedIndex === state.game.moveHistory.length
      return {
        ...state,
        selected: null,
        replayIndex: atLive ? null : clampedIndex,
        // Reviewing an earlier position replaces the end-of-game dialog with the
        // slim result bar; the dialog can be reopened from there.
        resultSeen: state.result !== null && !atLive ? true : state.resultSeen,
      }
    }
    case 'TOGGLE_BOARD':
      return { ...state, flipped: !state.flipped }
    case 'TOGGLE_COLOR_BLIND_MODE':
      return { ...state, colorBlindMode: !state.colorBlindMode }
    case 'TOGGLE_PIECE_LABELS':
      return { ...state, useKoreanLabels: !state.useKoreanLabels }
    case 'IMPORT':
      return {
        ...state,
        screen: 'GAME',
        game: action.session.game,
        selected: null,
        replayIndex: null,
        elapsed: action.session.elapsed,
        flipped: action.session.flipped,
        colorBlindMode: action.session.colorBlindMode,
        useKoreanLabels: action.session.useKoreanLabels,
        result: action.session.result ?? toSessionResult(action.session.game),
        resultSeen: false,
        drawOfferBy: null,
        restoreCandidate: null,
      }
    case 'TICK':
      if (!canAct(state)) {
        return state
      }
      return {
        ...state,
        elapsed: { ...state.elapsed, [state.game.turn]: state.elapsed[state.game.turn] + 1 },
      }
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(reducer, undefined, initialSession)

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (session.screen !== 'GAME') {
      return
    }
    saveSession({
      version: 1,
      game: session.game,
      elapsed: session.elapsed,
      flipped: session.flipped,
      colorBlindMode: session.colorBlindMode,
      useKoreanLabels: session.useKoreanLabels,
      result: session.result,
      savedAt: new Date().toISOString(),
    })
  }, [session.colorBlindMode, session.elapsed, session.flipped, session.game, session.result, session.screen, session.useKoreanLabels])

  const canInteract = canAct(session)

  const viewState = useMemo(
    () => (session.replayIndex === null ? session.game : replayGame(session.game, session.replayIndex)),
    [session.game, session.replayIndex],
  )
  const legalMoves = useMemo(
    () => (canInteract ? generateLegalMoves(session.game) : []),
    [canInteract, session.game],
  )
  const selectedMoves = useMemo(
    () =>
      session.selected === null
        ? []
        : legalMoves.filter((move) => move.from !== null && samePosition(move.from, session.selected!)),
    [legalMoves, session.selected],
  )
  const checkedSide = useMemo(
    () => (isCheck(viewState, viewState.turn) ? viewState.turn : null),
    [viewState],
  )

  // `dispatch` is stable, so these never change identity — safe to hand to
  // memoized children (the board) without re-rendering them every clock tick.
  const actions = useMemo(
    () => ({
      startGame: (config: GameConfig) => {
        clearSavedSession()
        dispatch({ type: 'START', config })
      },
      returnToSetup: () => {
        clearSavedSession()
        dispatch({ type: 'SETUP' })
      },
      discardSavedGame: () => {
        clearSavedSession()
        dispatch({ type: 'DISCARD_RESTORE' })
      },
      activatePosition: (position: Position) => dispatch({ type: 'ACTIVATE_POSITION', position }),
      requestMove: (from: Position, to: Position) => dispatch({ type: 'REQUEST_MOVE', from, to }),
      deselect: () => dispatch({ type: 'DESELECT' }),
      passTurn: () => dispatch({ type: 'PASS' }),
      undo: () => dispatch({ type: 'UNDO' }),
      resign: () => dispatch({ type: 'RESIGN' }),
      offerDraw: () => dispatch({ type: 'OFFER_DRAW' }),
      answerDraw: (accepted: boolean) => dispatch({ type: 'ANSWER_DRAW', accepted }),
      reopenResult: () => dispatch({ type: 'REOPEN_RESULT' }),
      setReplayIndex: (index: number) => dispatch({ type: 'SET_REPLAY', index }),
      toggleBoard: () => dispatch({ type: 'TOGGLE_BOARD' }),
      toggleColorBlindMode: () => dispatch({ type: 'TOGGLE_COLOR_BLIND_MODE' }),
      togglePieceLabels: () => dispatch({ type: 'TOGGLE_PIECE_LABELS' }),
      importGame: (serialized: string) => {
        try {
          dispatch({ type: 'IMPORT', session: parseSession(serialized) })
          return true
        } catch {
          return false
        }
      },
    }),
    [],
  )

  const value = useMemo<GameContextValue>(
    () => ({
      ...actions,
      session,
      viewState,
      legalMoves,
      selectedMoves,
      checkedSide,
      canInteract,
      restoreSavedGame: () => {
        if (session.restoreCandidate !== null) {
          dispatch({ type: 'RESTORE', session: session.restoreCandidate })
        }
      },
      exportGame: () =>
        JSON.stringify(
          {
            version: 1,
            game: session.game,
            elapsed: session.elapsed,
            flipped: session.flipped,
            colorBlindMode: session.colorBlindMode,
            useKoreanLabels: session.useKoreanLabels,
            result: session.result,
            savedAt: new Date().toISOString(),
          } satisfies PersistedSession,
          null,
          2,
        ),
    }),
    [actions, session, viewState, legalMoves, selectedMoves, checkedSide, canInteract],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function GameConsumer({ children }: { children: (context: GameContextValue) => ReactNode }) {
  const context = useContext(GameContext)
  if (context === null) {
    throw new Error('GameConsumer must be used inside GameProvider.')
  }
  return <>{children(context)}</>
}