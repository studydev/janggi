import { agreeDraw, createGame, makeMove, pass, resign, undo } from '../engine';
import type { GameConfig, GameState, Move, Setup, Side } from '../engine/types';
import { MAX_ELAPSED_SECONDS } from './serialization';

export interface AppState {
  readonly game: GameState | null;
  readonly replayIndex: number | null;
  readonly elapsedSeconds: number;
  readonly error: string | null;
}

export type GameAction =
  | { type: 'START'; hanSetup?: Setup; choSetup?: Setup; config?: Partial<GameConfig> }
  | { type: 'MOVE'; move: Move }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'RESIGN'; side: Side }
  | { type: 'AGREE_DRAW' }
  | { type: 'REPLAY'; index: number | null }
  | { type: 'LOAD'; game: GameState; elapsedSeconds: number }
  | { type: 'TICK'; seconds?: number }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

export const initialAppState: AppState = { game: null, replayIndex: null, elapsedSeconds: 0, error: null };

function clampTime(seconds: number): number {
  return Math.min(MAX_ELAPSED_SECONDS, Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0));
}

export function gameReducer(state: AppState, action: GameAction): AppState {
  try {
    switch (action.type) {
      case 'START':
        return { game: createGame(action.hanSetup, action.choSetup, action.config), replayIndex: null, elapsedSeconds: 0, error: null };
      case 'LOAD':
        return { game: action.game, replayIndex: null, elapsedSeconds: clampTime(action.elapsedSeconds), error: null };
      case 'RESET':
        return initialAppState;
      case 'CLEAR_ERROR':
        return { ...state, error: null };
      case 'REPLAY': {
        if (!state.game) return state;
        const replayIndex = action.index === null ? null
          : Math.min(state.game.moveHistory.length, Math.max(0, Number.isFinite(action.index) ? Math.floor(action.index) : 0));
        return { ...state, replayIndex, error: null };
      }
      case 'TICK':
        if (!state.game || state.game.result || state.replayIndex !== null) return state;
        return { ...state, elapsedSeconds: clampTime(state.elapsedSeconds + clampTime(action.seconds ?? 1)) };
      default: {
        if (!state.game) return { ...state, error: '먼저 새 대국을 시작해 주세요.' };
        if (state.replayIndex !== null) return { ...state, error: '기보 재생을 마친 뒤 대국을 진행해 주세요.' };
        let game: GameState;
        switch (action.type) {
          case 'MOVE': game = makeMove(state.game, action.move); break;
          case 'PASS': game = pass(state.game); break;
          case 'UNDO': game = undo(state.game); break;
          case 'RESIGN': game = resign(state.game, action.side); break;
          case 'AGREE_DRAW': game = agreeDraw(state.game); break;
        }
        return { ...state, game, error: null };
      }
    }
  } catch (error) {
    return { ...state, error: error instanceof Error ? error.message : '대국을 진행하지 못했습니다. 다시 시도해 주세요.' };
  }
}
