import {
  BOARD_SIZE,
  boardKey,
  createInitialBoard,
  findGung,
  opponent,
  pieceAt,
  samePosition,
  toIndex,
  toPosition,
} from './board';
import { generateAllPseudoMoves, generatePieceMoves } from './moves';
import { DEFAULT_CONFIG } from './types';
import type { Board, GameConfig, GameState, Move, MoveInput, Position, SetupCode, Side, Square } from './types';

export interface NewGameOptions {
  readonly hanSetup?: SetupCode;
  readonly choSetup?: SetupCode;
  readonly config?: Partial<GameConfig>;
}

export function createGame(options: NewGameOptions = {}): GameState {
  const hanSetup = options.hanSetup ?? 'MSMS';
  const choSetup = options.choSetup ?? 'MSMS';
  const config: GameConfig = { ...DEFAULT_CONFIG, ...options.config };
  const board = createInitialBoard(hanSetup, choSetup);
  return {
    board,
    turn: 'CHO', // 초(楚)가 선수
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config,
    positionCounts: { [boardKey(board, 'CHO')]: 1 },
    setup: { HAN: hanSetup, CHO: choSetup },
  };
}

/** 보드에만 착수를 반영한 새 보드를 만든다. 규칙 검사는 하지 않는다. */
export function applyMoveToBoard(board: Board, move: MoveInput): Board {
  const next = board.slice() as Square[];
  next[toIndex(move.to)] = board[toIndex(move.from)] ?? null;
  next[toIndex(move.from)] = null;
  return next;
}

/**
 * 해당 지점이 bySide 진영에게 공격받는지 판정한다.
 * 공격 판정은 이동 생성기를 그대로 재사용하므로 이동 규칙과 절대 갈라지지 않는다.
 */
export function isAttacked(board: Board, pos: Position, bySide: Side): boolean {
  for (let i = 0; i < BOARD_SIZE; i += 1) {
    const piece = board[i];
    if (!piece || piece.side !== bySide) continue;
    const from = toPosition(i);
    for (const target of generatePieceMoves(board, from)) {
      if (samePosition(target, pos)) return true;
    }
  }
  return false;
}

export function isCheckOnBoard(board: Board, side: Side): boolean {
  const gung = findGung(board, side);
  if (!gung) return false;
  return isAttacked(board, gung, opponent(side));
}

export function isCheck(state: GameState, side: Side): boolean {
  return isCheckOnBoard(state.board, side);
}

/** 두고 나서 자기 궁이 장군에 걸리지 않는 수만 남긴다. 한 수 쉬기(pass)는 포함하지 않는다. */
export function generateLegalMoves(state: GameState, side: Side = state.turn): MoveInput[] {
  const legal: MoveInput[] = [];
  for (const move of generateAllPseudoMoves(state.board, side)) {
    const next = applyMoveToBoard(state.board, move);
    if (!isCheckOnBoard(next, side)) legal.push(move);
  }
  return legal;
}

export function generateLegalTargets(state: GameState, from: Position): Position[] {
  const piece = pieceAt(state.board, from);
  if (!piece || piece.side !== state.turn) return [];
  return generatePieceMoves(state.board, from).filter(
    (to) => !isCheckOnBoard(applyMoveToBoard(state.board, { from, to }), piece.side),
  );
}

export function isLegalMove(state: GameState, move: MoveInput): boolean {
  return generateLegalTargets(state, move.from).some((to) => samePosition(to, move.to));
}

function bumpPositionCount(counts: Readonly<Record<string, number>>, key: string): Record<string, number> {
  const next = { ...counts };
  next[key] = (next[key] ?? 0) + 1;
  return next;
}

/**
 * 착수를 반영한 새 GameState를 돌려준다. 원본은 변경하지 않는다.
 * 의사이동 범위만 검증한다. 자기 장군 노출 여부는 generateLegalMoves가 걸러낸다.
 */
export function makeMove(state: GameState, move: MoveInput): GameState {
  const piece = pieceAt(state.board, move.from);
  if (!piece) throw new Error(`출발 지점에 기물이 없다: ${move.from.file},${move.from.rank}`);
  if (piece.side !== state.turn) throw new Error('자기 차례가 아닌 기물이다');
  if (!generatePieceMoves(state.board, move.from).some((to) => samePosition(to, move.to))) {
    throw new Error(`규칙상 갈 수 없는 지점이다: ${move.to.file},${move.to.rank}`);
  }

  const target = pieceAt(state.board, move.to);
  const board = applyMoveToBoard(state.board, move);
  const turn = opponent(state.turn);
  const record: Move = {
    from: move.from,
    to: move.to,
    piece: piece.type,
    side: piece.side,
    captured: target ? target.type : null,
    isPass: false,
  };

  return {
    ...state,
    board,
    turn,
    moveHistory: [...state.moveHistory, record],
    capturedPieces: target
      ? { ...state.capturedPieces, [piece.side]: [...state.capturedPieces[piece.side], target.type] }
      : state.capturedPieces,
    positionCounts: bumpPositionCount(state.positionCounts, boardKey(board, turn)),
  };
}

/** 한 수 쉬기. 장기에서는 언제든 허용된다. */
export function pass(state: GameState): GameState {
  const gung = findGung(state.board, state.turn) ?? { file: 5, rank: state.turn === 'HAN' ? 2 : 9 };
  const turn = opponent(state.turn);
  const record: Move = {
    from: gung,
    to: gung,
    piece: 'GUNG',
    side: state.turn,
    captured: null,
    isPass: true,
  };
  return {
    ...state,
    turn,
    moveHistory: [...state.moveHistory, record],
    positionCounts: bumpPositionCount(state.positionCounts, boardKey(state.board, turn)),
  };
}

/** 기보를 처음부터 다시 두어 상태를 만든다. undo·리플레이·불러오기가 모두 이 함수를 쓴다. */
export function replayMoves(
  setup: Readonly<Record<Side, SetupCode>>,
  config: GameConfig,
  moves: readonly Move[],
): GameState {
  let state = createGame({ hanSetup: setup.HAN, choSetup: setup.CHO, config });
  for (const move of moves) {
    state = move.isPass ? pass(state) : makeMove(state, { from: move.from, to: move.to });
  }
  return state;
}

export function undoMove(state: GameState): GameState {
  if (state.moveHistory.length === 0) return state;
  return replayMoves(state.setup, state.config, state.moveHistory.slice(0, -1));
}
