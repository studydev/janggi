/**
 * 화면 상태 관리. 규칙 판단은 한 줄도 두지 않는다 — 전부 엔진 함수를 호출한다.
 */
import { createInitialState, pieceAt, samePos } from '../../engine/board';
import { stateFromRecord, type GameRecord } from '../../engine/record';
import {
  agreementResult,
  getGameResult,
  resignationResult,
  type GameResult,
} from '../../engine/result';
import {
  canPass,
  generateLegalDestinations,
  pass as enginePass,
  tryMove,
  undoMove,
} from '../../engine/rules';
import {
  DEFAULT_CONFIG,
  type GameConfig,
  type GameState,
  type HorseSetup,
  type Position,
  type Side,
} from '../../engine/types';
import { DEFAULT_SETTINGS, type Settings } from '../settings';

export type Phase = 'SETUP' | 'PLAYING' | 'FINISHED';

export interface AppState {
  readonly phase: Phase;
  readonly setup: Readonly<Record<Side, HorseSetup>>;
  readonly config: GameConfig;
  readonly game: GameState;
  readonly result: GameResult;
  readonly selected: Position | null;
  readonly legalTargets: readonly Position[];
  /** null 이면 실시간 대국, 숫자면 그 수까지의 국면을 보고 있는 리플레이 상태. */
  readonly replayPly: number | null;
  readonly flipped: boolean;
  readonly settings: Settings;
  readonly drawOffer: Side | null;
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  readonly notice: string | null;
  /** 새로고침 후 복구 제안. 사용자가 예/아니오를 고른다. */
  readonly restoreOffer: GameRecord | null;
}

export type Action =
  | { type: 'SET_SETUP'; side: Side; setup: HorseSetup }
  | { type: 'SET_CONFIG'; config: Partial<GameConfig> }
  | { type: 'START' }
  | { type: 'SELECT'; at: Position }
  | { type: 'MOVE'; from: Position; to: Position }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'RESIGN'; side: Side }
  | { type: 'OFFER_DRAW'; side: Side }
  | { type: 'RESPOND_DRAW'; accept: boolean }
  | { type: 'GOTO_PLY'; ply: number | null }
  | { type: 'TOGGLE_FLIP' }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_RECORD'; record: GameRecord }
  | { type: 'OFFER_RESTORE'; record: GameRecord }
  | { type: 'DISMISS_RESTORE' }
  | { type: 'DISMISS_NOTICE' };

const INITIAL_GAME = createInitialState('MSMS', 'MSMS', DEFAULT_CONFIG);

export const initialAppState: AppState = {
  phase: 'SETUP',
  setup: { HAN: 'MSMS', CHO: 'MSMS' },
  config: DEFAULT_CONFIG,
  game: INITIAL_GAME,
  result: getGameResult(INITIAL_GAME),
  selected: null,
  legalTargets: [],
  replayPly: null,
  flipped: false,
  settings: DEFAULT_SETTINGS,
  drawOffer: null,
  startedAt: null,
  endedAt: null,
  notice: null,
  restoreOffer: null,
};

/** 착수 후 공통 처리: 결과 재계산, 선택 해제, 종료 판정. */
function afterMove(state: AppState, game: GameState): AppState {
  const result = getGameResult(game);
  const finished = result.status !== 'PLAYING';
  return {
    ...state,
    game,
    result,
    selected: null,
    legalTargets: [],
    drawOffer: null,
    replayPly: null,
    phase: finished ? 'FINISHED' : 'PLAYING',
    endedAt: finished ? Date.now() : null,
    notice: null,
  };
}

function isLive(state: AppState): boolean {
  return state.phase === 'PLAYING' && state.replayPly === null;
}

export function gameReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SETUP':
      return { ...state, setup: { ...state.setup, [action.side]: action.setup } };

    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.config } };

    case 'START': {
      const game = createInitialState(state.setup.HAN, state.setup.CHO, state.config);
      return {
        ...state,
        phase: 'PLAYING',
        game,
        result: getGameResult(game),
        selected: null,
        legalTargets: [],
        replayPly: null,
        drawOffer: null,
        startedAt: Date.now(),
        endedAt: null,
        notice: null,
        restoreOffer: null,
      };
    }

    case 'SELECT': {
      if (!isLive(state)) return state;
      const { at } = action;
      const piece = pieceAt(state.game.board, at);

      if (state.selected !== null) {
        if (samePos(state.selected, at)) {
          return { ...state, selected: null, legalTargets: [] };
        }
        if (state.legalTargets.some((t) => samePos(t, at))) {
          const next = tryMove(state.game, state.selected, at);
          return next === null ? state : afterMove(state, next);
        }
      }

      if (piece !== null && piece.side === state.game.turn) {
        return { ...state, selected: at, legalTargets: generateLegalDestinations(state.game, at) };
      }
      return { ...state, selected: null, legalTargets: [] };
    }

    case 'MOVE': {
      if (!isLive(state)) return state;
      const next = tryMove(state.game, action.from, action.to);
      if (next === null) {
        return { ...state, selected: null, legalTargets: [], notice: '그 자리로는 둘 수 없습니다.' };
      }
      return afterMove(state, next);
    }

    case 'PASS': {
      if (!isLive(state)) return state;
      if (!canPass(state.game)) {
        return { ...state, notice: '장군을 받은 상태에서는 쉴 수 없습니다. 멍군해야 합니다.' };
      }
      return afterMove(state, enginePass(state.game));
    }

    case 'UNDO': {
      if (state.phase === 'SETUP') return state;
      if (state.game.moveHistory.length === 0) return state;
      const game = undoMove(state.game);
      return {
        ...afterMove(state, game),
        phase: 'PLAYING',
        endedAt: null,
        result: getGameResult(game),
      };
    }

    case 'RESIGN':
      if (state.phase !== 'PLAYING') return state;
      return {
        ...state,
        phase: 'FINISHED',
        result: resignationResult(state.game, action.side),
        selected: null,
        legalTargets: [],
        drawOffer: null,
        endedAt: Date.now(),
      };

    case 'OFFER_DRAW':
      if (state.phase !== 'PLAYING') return state;
      return { ...state, drawOffer: action.side };

    case 'RESPOND_DRAW':
      if (state.drawOffer === null) return state;
      if (!action.accept) return { ...state, drawOffer: null };
      return {
        ...state,
        phase: 'FINISHED',
        result: agreementResult(state.game),
        drawOffer: null,
        selected: null,
        legalTargets: [],
        endedAt: Date.now(),
      };

    case 'GOTO_PLY': {
      if (state.phase === 'SETUP') return state;
      const max = state.game.moveHistory.length;
      const ply = action.ply === null ? null : Math.max(0, Math.min(action.ply, max));
      return {
        ...state,
        replayPly: ply === max ? null : ply,
        selected: null,
        legalTargets: [],
      };
    }

    case 'TOGGLE_FLIP':
      return { ...state, flipped: !state.flipped };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'NEW_GAME':
      return {
        ...initialAppState,
        settings: state.settings,
        setup: state.setup,
        config: state.config,
        flipped: state.flipped,
      };

    case 'LOAD_RECORD': {
      const { state: game, appliedPlies } = stateFromRecord(action.record);
      const result = getGameResult(game);
      const truncated = appliedPlies < action.record.moves.length;
      return {
        ...state,
        phase: result.status === 'PLAYING' ? 'PLAYING' : 'FINISHED',
        setup: action.record.setup,
        config: action.record.config,
        game,
        result,
        selected: null,
        legalTargets: [],
        replayPly: null,
        drawOffer: null,
        startedAt: Date.now(),
        endedAt: result.status === 'PLAYING' ? null : Date.now(),
        restoreOffer: null,
        notice: truncated
          ? `기보 ${appliedPlies}수까지만 규칙에 맞아 그 지점까지 불러왔습니다.`
          : null,
      };
    }

    case 'OFFER_RESTORE':
      return { ...state, restoreOffer: action.record };

    case 'DISMISS_RESTORE':
      return { ...state, restoreOffer: null };

    case 'DISMISS_NOTICE':
      return { ...state, notice: null };

    default:
      return state;
  }
}
