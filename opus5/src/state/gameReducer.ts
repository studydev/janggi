import { findGung, pieceAt, samePosition } from '../engine/board';
import { moveText, SIDE_NAME } from '../engine/janggi-notation';
import type { LabelMode } from '../engine/janggi-notation';
import { getGameResult } from '../engine/result';
import type { GameResult } from '../engine/result';
import { createGame, generateLegalTargets, isCheck, makeMove, pass, undoMove } from '../engine/rules';
import type { GameConfig, GameState, Position, SetupCode, Side } from '../engine/types';

export type Phase = 'SETUP' | 'PLAYING';

export interface DisplayOptions {
  readonly labelMode: LabelMode;
  readonly flipped: boolean;
  readonly colorBlind: boolean;
}

export interface AppState {
  readonly phase: Phase;
  readonly game: GameState;
  readonly selected: Position | null;
  readonly targets: readonly Position[];
  readonly cursor: Position;
  /** 기권·합의 무승부처럼 국면만으로는 알 수 없는 결과 */
  readonly override: GameResult | null;
  /** null이면 실시간 대국, 숫자면 그 수까지 되감은 리플레이 */
  readonly replayPly: number | null;
  readonly drawOffer: Side | null;
  readonly options: DisplayOptions;
  readonly startedAt: number;
  readonly message: string;
}

export type Action =
  | { type: 'START_GAME'; hanSetup: SetupCode; choSetup: SetupCode; config: Partial<GameConfig> }
  | { type: 'RESUME'; game: GameState }
  | { type: 'PRESS'; pos: Position }
  | { type: 'DROP'; pos: Position }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'RESIGN'; side: Side }
  | { type: 'OFFER_DRAW'; side: Side }
  | { type: 'RESPOND_DRAW'; accept: boolean }
  | { type: 'SET_OPTIONS'; options: Partial<DisplayOptions> }
  | { type: 'MOVE_CURSOR'; df: number; dr: number }
  | { type: 'ACTIVATE_CURSOR' }
  | { type: 'REPLAY_GOTO'; ply: number | null }
  | { type: 'NEW_GAME' };

export function resultOf(state: AppState): GameResult {
  return state.override ?? getGameResult(state.game);
}

export function isLive(state: AppState): boolean {
  return state.phase === 'PLAYING' && state.replayPly === null && resultOf(state).status === 'PLAYING';
}

function describeTurn(game: GameState): string {
  const check = isCheck(game, game.turn) ? ' 장군!' : '';
  return `${SIDE_NAME[game.turn]} 차례.${check}`;
}

export function createInitialAppState(): AppState {
  const game = createGame();
  return {
    phase: 'SETUP',
    game,
    selected: null,
    targets: [],
    cursor: { file: 5, rank: 7 },
    override: null,
    replayPly: null,
    drawOffer: null,
    options: { labelMode: 'HANJA', flipped: false, colorBlind: false },
    startedAt: Date.now(),
    message: '대국 설정을 골라라.',
  };
}

function applyMove(state: AppState, from: Position, to: Position): AppState {
  const game = makeMove(state.game, { from, to });
  const last = game.moveHistory[game.moveHistory.length - 1];
  const result = getGameResult(game);
  const message =
    result.status === 'PLAYING'
      ? `${SIDE_NAME[last.side]} ${moveText(last)}. ${describeTurn(game)}`
      : `${SIDE_NAME[last.side]} ${moveText(last)}. ${result.reason}`;
  return {
    ...state,
    game,
    selected: null,
    targets: [],
    cursor: to,
    drawOffer: null,
    message,
  };
}

function select(state: AppState, pos: Position): AppState {
  const piece = pieceAt(state.game.board, pos);
  if (!piece || piece.side !== state.game.turn) {
    return { ...state, selected: null, targets: [], cursor: pos };
  }
  return {
    ...state,
    selected: pos,
    targets: generateLegalTargets(state.game, pos),
    cursor: pos,
  };
}

function clampCursor(pos: Position): Position {
  return {
    file: Math.min(9, Math.max(1, pos.file)),
    rank: Math.min(10, Math.max(1, pos.rank)),
  };
}

export function gameReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_GAME': {
      const game = createGame({
        hanSetup: action.hanSetup,
        choSetup: action.choSetup,
        config: action.config,
      });
      return {
        ...createInitialAppState(),
        phase: 'PLAYING',
        game,
        options: state.options,
        cursor: { file: 5, rank: 7 },
        startedAt: Date.now(),
        message: `대국 시작. ${describeTurn(game)}`,
      };
    }

    case 'RESUME':
      return {
        ...createInitialAppState(),
        phase: 'PLAYING',
        game: action.game,
        options: state.options,
        startedAt: Date.now(),
        message: `저장된 대국을 이어서 둔다. ${describeTurn(action.game)}`,
      };

    case 'PRESS': {
      if (!isLive(state)) return state;
      if (state.selected && state.targets.some((t) => samePosition(t, action.pos))) {
        return applyMove(state, state.selected, action.pos);
      }
      return select(state, action.pos);
    }

    case 'DROP': {
      if (!isLive(state) || !state.selected) return state;
      if (!state.targets.some((t) => samePosition(t, action.pos))) return state;
      return applyMove(state, state.selected, action.pos);
    }

    case 'ACTIVATE_CURSOR': {
      if (!isLive(state)) return state;
      if (state.selected && state.targets.some((t) => samePosition(t, state.cursor))) {
        return applyMove(state, state.selected, state.cursor);
      }
      return select(state, state.cursor);
    }

    case 'MOVE_CURSOR':
      return { ...state, cursor: clampCursor({ file: state.cursor.file + action.df, rank: state.cursor.rank + action.dr }) };

    case 'PASS': {
      if (!isLive(state)) return state;
      const game = pass(state.game);
      return {
        ...state,
        game,
        selected: null,
        targets: [],
        drawOffer: null,
        message: `${SIDE_NAME[state.game.turn]} 한 수 쉼. ${describeTurn(game)}`,
      };
    }

    case 'UNDO': {
      if (state.phase !== 'PLAYING' || state.game.moveHistory.length === 0) return state;
      const game = undoMove(state.game);
      return {
        ...state,
        game,
        selected: null,
        targets: [],
        override: null,
        replayPly: null,
        drawOffer: null,
        message: `한 수 물렀다. ${describeTurn(game)}`,
      };
    }

    case 'RESIGN': {
      if (state.phase !== 'PLAYING' || state.override) return state;
      const winner = action.side === 'HAN' ? 'CHO' : 'HAN';
      return {
        ...state,
        selected: null,
        targets: [],
        drawOffer: null,
        override: { status: 'RESIGN', winner, reason: `${SIDE_NAME[action.side]} 기권` },
        message: `${SIDE_NAME[action.side]}이(가) 기권했다.`,
      };
    }

    case 'OFFER_DRAW':
      if (!isLive(state)) return state;
      return { ...state, drawOffer: action.side, message: `${SIDE_NAME[action.side]}이(가) 무승부를 제안했다.` };

    case 'RESPOND_DRAW': {
      if (!state.drawOffer) return state;
      if (!action.accept) {
        return { ...state, drawOffer: null, message: '무승부 제안을 거절했다.' };
      }
      return {
        ...state,
        drawOffer: null,
        override: { status: 'DRAW_AGREED', winner: null, reason: '합의 무승부' },
        message: '합의 무승부로 대국을 마쳤다.',
      };
    }

    case 'SET_OPTIONS':
      return { ...state, options: { ...state.options, ...action.options } };

    case 'REPLAY_GOTO': {
      if (state.phase !== 'PLAYING') return state;
      const total = state.game.moveHistory.length;
      const ply = action.ply === null ? null : Math.min(total, Math.max(0, action.ply));
      return {
        ...state,
        replayPly: ply === total ? null : ply,
        selected: null,
        targets: [],
        message: ply === null || ply === total ? '현재 국면으로 돌아왔다.' : `${ply}수 국면을 보고 있다.`,
      };
    }

    case 'NEW_GAME':
      return { ...createInitialAppState(), options: state.options };

    default:
      return state;
  }
}

export function checkedGungPosition(game: GameState): Position | null {
  if (!isCheck(game, game.turn)) return null;
  return findGung(game.board, game.turn);
}
