// UI 레벨 애플리케이션 상태. 엔진 GameState를 감싸서 화면 전환, 선택, 리플레이, 기권/무승부
// 같은 "게임 진행" 개념을 추가한다. 규칙 판단은 절대 하지 않고 engine 함수만 호출한다.
import { canPass, createInitialGameState, generateLegalMoves, getGameResult, getLegalMovesFrom, makeMove, opponent, pass, pieceAt, samePosition } from '../engine'
import type { GameConfig, GameResult, GameState, JinSetup, Move, Position, Side } from '../engine'

export type Screen = 'SETUP' | 'PLAYING'

export interface MatchSetup {
  readonly hanSetup: JinSetup
  readonly choSetup: JinSetup
  readonly config: GameConfig
}

export type EndReason =
  | { readonly kind: 'ENGINE'; readonly result: GameResult }
  | { readonly kind: 'RESIGNATION'; readonly winner: Side }
  | { readonly kind: 'DRAW_BY_AGREEMENT' }

export interface AppState {
  readonly screen: Screen
  readonly match: MatchSetup | null
  /** states[0]=초기 상태, states[i]=i번째 수(또는 패스) 이후 상태. */
  readonly states: readonly GameState[]
  /** 현재 화면에 보여줄 인덱스. states.length-1이면 "라이브"(실제 대국 진행 지점). */
  readonly viewIndex: number
  readonly selected: Position | null
  readonly pendingDrawOffer: Side | null
  readonly endReason: EndReason | null
  readonly showHanja: boolean
  readonly boardFlipped: boolean
}

export type Action =
  | { readonly type: 'START_GAME'; readonly match: MatchSetup }
  | { readonly type: 'SELECT_POINT'; readonly pos: Position }
  | { readonly type: 'PASS_TURN' }
  | { readonly type: 'UNDO_MOVE' }
  | { readonly type: 'RESIGN'; readonly side: Side }
  | { readonly type: 'OFFER_DRAW'; readonly side: Side }
  | { readonly type: 'RESPOND_DRAW'; readonly accept: boolean }
  | { readonly type: 'GOTO_VIEW_INDEX'; readonly index: number }
  | { readonly type: 'TOGGLE_HANJA' }
  | { readonly type: 'FLIP_BOARD' }
  | { readonly type: 'LOAD_MATCH'; readonly match: MatchSetup; readonly states: readonly GameState[]; readonly endReason: EndReason | null }
  | { readonly type: 'NEW_GAME' }

export function createFreshAppState(): AppState {
  return {
    screen: 'SETUP',
    match: null,
    states: [],
    viewIndex: -1,
    selected: null,
    pendingDrawOffer: null,
    endReason: null,
    showHanja: true,
    boardFlipped: false,
  }
}

export function isLive(state: AppState): boolean {
  return state.states.length > 0 && state.viewIndex === state.states.length - 1
}

export function liveState(state: AppState): GameState {
  return state.states[state.states.length - 1]
}

export function viewState(state: AppState): GameState {
  return state.states[state.viewIndex]
}

function deriveEngineEndReason(next: GameState): EndReason | null {
  const result = getGameResult(next)
  return result.status === 'PLAYING' ? null : { kind: 'ENGINE', result }
}

function pushLiveState(state: AppState, next: GameState): AppState {
  const nextStates = [...state.states, next]
  return {
    ...state,
    states: nextStates,
    viewIndex: nextStates.length - 1,
    selected: null,
    pendingDrawOffer: null,
    endReason: deriveEngineEndReason(next),
  }
}

function handleSelectPoint(state: AppState, pos: Position): AppState {
  if (!state.match || state.endReason || !isLive(state)) return state
  const live = liveState(state)
  const clickedPiece = pieceAt(live.board, pos)

  if (state.selected) {
    if (samePosition(state.selected, pos)) {
      return { ...state, selected: null }
    }
    const legalTargets = getLegalMovesFrom(live, state.selected)
    if (legalTargets.some((t) => samePosition(t, pos))) {
      const from = state.selected
      const move = generateLegalMoves(live).find((m: Move) => samePosition(m.from, from) && samePosition(m.to, pos))
      if (!move) return state
      return pushLiveState(state, makeMove(live, move))
    }
    if (clickedPiece && clickedPiece.side === live.turn) {
      return { ...state, selected: pos }
    }
    return { ...state, selected: null }
  }

  if (clickedPiece && clickedPiece.side === live.turn) {
    return { ...state, selected: pos }
  }
  return state
}

export function gameReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_GAME': {
      const initial = createInitialGameState(action.match.hanSetup, action.match.choSetup, action.match.config)
      return {
        ...createFreshAppState(),
        screen: 'PLAYING',
        match: action.match,
        states: [initial],
        viewIndex: 0,
      }
    }

    case 'SELECT_POINT':
      return handleSelectPoint(state, action.pos)

    case 'PASS_TURN': {
      if (!state.match || state.endReason || !isLive(state)) return state
      const live = liveState(state)
      if (!canPass(live)) return state
      return pushLiveState(state, pass(live))
    }

    case 'UNDO_MOVE': {
      if (!state.match || state.endReason || !isLive(state) || state.states.length <= 1) return state
      const nextStates = state.states.slice(0, -1)
      return { ...state, states: nextStates, viewIndex: nextStates.length - 1, selected: null }
    }

    case 'RESIGN': {
      if (!state.match || state.endReason) return state
      return { ...state, endReason: { kind: 'RESIGNATION', winner: opponent(action.side) }, selected: null, pendingDrawOffer: null }
    }

    case 'OFFER_DRAW': {
      if (!state.match || state.endReason) return state
      return { ...state, pendingDrawOffer: action.side }
    }

    case 'RESPOND_DRAW': {
      if (!state.pendingDrawOffer) return state
      if (action.accept) return { ...state, endReason: { kind: 'DRAW_BY_AGREEMENT' }, pendingDrawOffer: null }
      return { ...state, pendingDrawOffer: null }
    }

    case 'GOTO_VIEW_INDEX': {
      if (state.states.length === 0) return state
      const clamped = Math.max(0, Math.min(action.index, state.states.length - 1))
      return { ...state, viewIndex: clamped, selected: null }
    }

    case 'TOGGLE_HANJA':
      return { ...state, showHanja: !state.showHanja }

    case 'FLIP_BOARD':
      return { ...state, boardFlipped: !state.boardFlipped }

    case 'LOAD_MATCH':
      return {
        ...createFreshAppState(),
        screen: 'PLAYING',
        match: action.match,
        states: action.states,
        viewIndex: action.states.length - 1,
        endReason: action.endReason,
      }

    case 'NEW_GAME':
      return createFreshAppState()

    default:
      return state
  }
}
