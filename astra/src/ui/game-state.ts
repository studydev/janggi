import { createInitialState, DEFAULT_CONFIG, getPiece, samePosition } from '../engine/board'
import { stateAtMove } from '../engine/game-record'
import type { LoadedGame } from '../engine/game-record'
import { formatMove, SIDE_NAMES } from '../engine/janggi-notation'
import type { PieceNotation } from '../engine/janggi-notation'
import { getGameResult, resignGame, scoreAgreement } from '../engine/result'
import type { GameResult } from '../engine/result'
import { getLegalMovesFrom, makeMove, pass, undoMove } from '../engine/rules'
import type { GameConfig, GameState, PieceSetup, Position, Side } from '../engine/types'

export interface MatchSettings {
  hanSetup: PieceSetup
  choSetup: PieceSetup
  config: GameConfig
}

export interface Preferences {
  notation: PieceNotation
  flipped: boolean
  palette: 'classic' | 'accessible'
}

export interface MatchState {
  game: GameState
  settings: MatchSettings
  preferences: Preferences
  phase: 'setup' | 'playing'
  result: GameResult
  selected: Position | null
  cursor: number | null
  drawOffer: Side | null
  elapsedMs: number
  announcement: string
}

export const DEFAULT_SETTINGS: MatchSettings = { hanSetup: 'MSMS', choSetup: 'MSMS', config: DEFAULT_CONFIG }
export const DEFAULT_PREFERENCES: Preferences = { notation: 'hanja', flipped: false, palette: 'classic' }

export function createMatch(settings = DEFAULT_SETTINGS, preferences = DEFAULT_PREFERENCES): MatchState {
  const game = createInitialState(settings.hanSetup, settings.choSetup, settings.config)
  return { game, settings, preferences, phase: 'setup', result: getGameResult(game), selected: null, cursor: null, drawOffer: null, elapsedMs: 0, announcement: '대국 준비' }
}

export type GameAction =
  | { type: 'CONFIGURE'; settings: Partial<Omit<MatchSettings, 'config'>> & { config?: Partial<GameConfig> } }
  | { type: 'PREFERENCES'; preferences: Partial<Preferences> }
  | { type: 'START' | 'NEW' | 'PASS' | 'UNDO' | 'RESIGN' | 'OFFER_DRAW' | 'CLEAR' }
  | { type: 'SELECT'; position: Position }
  | { type: 'MOVE'; from: Position; to: Position }
  | { type: 'DRAW_RESPONSE'; accept: boolean }
  | { type: 'REPLAY'; cursor: number | null }
  | { type: 'TICK'; milliseconds: number }
  | { type: 'LOAD'; saved: LoadedGame }

export function isLive(state: MatchState): boolean {
  return state.phase === 'playing' && state.cursor === null && state.result.status === 'PLAYING' && !state.drawOffer
}

function advance(state: MatchState, game: GameState): MatchState {
  const move = game.moveHistory.at(-1)
  return { ...state, game, result: getGameResult(game), selected: null, drawOffer: null,
    announcement: `${move ? formatMove(move) + '. ' : ''}${SIDE_NAMES[game.turn]} 차례입니다.` }
}

function moveTo(state: MatchState, from: Position, to: Position): MatchState {
  try {
    return advance(state, makeMove(state.game, { from, to }))
  } catch {
    return { ...state, selected: null, announcement: '둘 수 없는 자리입니다.' }
  }
}

export function gameReducer(state: MatchState, action: GameAction): MatchState {
  switch (action.type) {
    case 'CONFIGURE': {
      if (state.phase !== 'setup') return state
      const settings = { ...state.settings, ...action.settings, config: { ...state.settings.config, ...action.settings.config } }
      return createMatch(settings, state.preferences)
    }
    case 'PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.preferences } }
    case 'NEW':
      return createMatch(state.settings, state.preferences)
    case 'LOAD': {
      const saved = action.saved
      const settings = { ...saved.initial, config: saved.game.config }
      return { ...createMatch(settings, state.preferences), game: saved.game, result: saved.result,
        elapsedMs: saved.elapsedMs, phase: 'playing', announcement: '기보를 불러왔습니다.' }
    }
    case 'START':
      return state.phase === 'setup' ? { ...state, phase: 'playing', announcement: '대국을 시작합니다. 초 차례입니다.' } : state
    case 'CLEAR':
      return { ...state, selected: null }
    case 'SELECT': {
      if (!isLive(state)) return state
      if (state.selected && getLegalMovesFrom(state.game, state.selected).some((move) => samePosition(move.to, action.position))) {
        return moveTo(state, state.selected, action.position)
      }
      const piece = getPiece(state.game.board, action.position)
      const selected = piece?.side === state.game.turn && (!state.selected || !samePosition(state.selected, action.position)) ? action.position : null
      return { ...state, selected }
    }
    case 'MOVE':
      return isLive(state) ? moveTo(state, action.from, action.to) : state
    case 'PASS':
      if (!isLive(state)) return state
      try { return advance(state, pass(state.game)) }
      catch { return { ...state, announcement: '장군을 먼저 해소해야 합니다.' } }
    case 'UNDO':
      if (state.phase !== 'playing' || state.cursor !== null || state.drawOffer || state.game.moveHistory.length === 0) return state
      return { ...advance(state, undoMove(state.game)), announcement: '한 수를 물렀습니다.' }
    case 'RESIGN':
      return isLive(state) ? { ...state, result: resignGame(state.game), selected: null, announcement: `${SIDE_NAMES[state.game.turn]} 기권` } : state
    case 'OFFER_DRAW':
      return isLive(state) ? { ...state, drawOffer: state.game.turn, selected: null } : state
    case 'DRAW_RESPONSE':
      return state.drawOffer ? { ...state, drawOffer: null, result: action.accept ? scoreAgreement(state.game) : state.result, announcement: action.accept ? '합의 종료' : '제안을 거절했습니다.' } : state
    case 'REPLAY':
      if (state.phase !== 'playing' || state.drawOffer) return state
      if (action.cursor !== null && (!Number.isInteger(action.cursor) || action.cursor < 0 || action.cursor > state.game.moveHistory.length)) return state
      return { ...state, cursor: action.cursor, selected: null }
    case 'TICK':
      return isLive(state) && Number.isFinite(action.milliseconds) && action.milliseconds > 0
        ? { ...state, elapsedMs: state.elapsedMs + action.milliseconds } : state
  }
}

export function viewedGame(state: MatchState): GameState {
  return state.cursor === null ? state.game : stateAtMove(state.game, state.cursor)
}