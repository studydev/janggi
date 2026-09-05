import { createInitialBoard, fromIndex, isInBoard, otherSide, pieceAt, positionKey, toIndex } from './board';
import { generatePseudoLegalMoves } from './moves';
import { getGameResult } from './result';
import type { Board, GameConfig, GameState, Move, MoveRecord, Position, Setup, Side } from './types';

export function createGame(
  hanSetup: Setup = 'MASANGMASANG',
  choSetup: Setup = 'MASANGMASANG',
  config: Partial<GameConfig> = {},
): GameState {
  const resolved: GameConfig = { bikjang: true, repetitionCount: 3, ...config };
  if (typeof resolved.bikjang !== 'boolean' || !Number.isInteger(resolved.repetitionCount)
    || resolved.repetitionCount < 2 || resolved.repetitionCount > 10) {
    throw new Error('빅장은 켜짐/꺼짐, 반복 횟수는 2~10 사이의 정수여야 합니다.');
  }
  const board = createInitialBoard(hanSetup, choSetup);
  return {
    board, turn: 'CHO', moveHistory: [], capturedPieces: [], config: resolved,
    positionHistory: [positionKey(board, 'CHO')], hanSetup, choSetup, result: null,
  };
}

/** Attacks and movement share exactly the same piece generators, including cannon screens. */
export function isAttacked(board: Board, pos: Position, bySide: Side): boolean {
  for (let index = 0; index < board.length; index++) {
    if (board[index]?.side !== bySide) continue;
    const from = fromIndex(index);
    if (generatePseudoLegalMoves(board, from).some(to => to.file === pos.file && to.rank === pos.rank)) return true;
  }
  return false;
}

export function isCheck(state: Pick<GameState, 'board'>, side: Side): boolean {
  const index = state.board.findIndex(piece => piece?.side === side && piece.type === 'GUNG');
  return index >= 0 && isAttacked(state.board, fromIndex(index), otherSide(side));
}

function movedBoard(board: Board, move: Move): Board {
  const next = [...board];
  next[toIndex(move.to)] = next[toIndex(move.from)] ?? null;
  next[toIndex(move.from)] = null;
  return next;
}

export function generateLegalMoves(state: GameState, side: Side = state.turn): Move[] {
  if (state.result) return [];
  const moves: Move[] = [];
  for (let index = 0; index < state.board.length; index++) {
    if (state.board[index]?.side !== side) continue;
    const from = fromIndex(index);
    for (const to of generatePseudoLegalMoves(state.board, from)) {
      // A general is never captured; checkmate ends the game before that can happen.
      if (pieceAt(state.board, to)?.type === 'GUNG') continue;
      const move = { from, to };
      if (!isCheck({ board: movedBoard(state.board, move) }, side)) moves.push(move);
    }
  }
  return moves;
}

function assertPlaying(state: GameState): void {
  if (state.result) throw new Error('이미 끝난 대국입니다.');
}

function finishTurn(state: GameState, board: Board, record: MoveRecord): GameState {
  const turn = otherSide(state.turn);
  const next: GameState = {
    ...state, board, turn,
    moveHistory: [...state.moveHistory, record],
    capturedPieces: record.captured ? [...state.capturedPieces, record.captured] : state.capturedPieces,
    positionHistory: [...state.positionHistory, positionKey(board, turn)],
    result: null,
  };
  const result = getGameResult(next);
  return result.status === 'PLAYING' ? next : { ...next, result };
}

export function makeMove(state: GameState, move: Move): GameState {
  assertPlaying(state);
  if (!isInBoard(move.from) || !isInBoard(move.to)) throw new Error('장기판 밖으로 이동할 수 없습니다.');
  const piece = pieceAt(state.board, move.from);
  const captured = pieceAt(state.board, move.to);
  const validDestination = piece?.side === state.turn && captured?.type !== 'GUNG'
    && generatePseudoLegalMoves(state.board, move.from).some(to => to.file === move.to.file && to.rank === move.to.rank);
  if (!piece || !validDestination) throw new Error('둘 수 없는 수입니다.');
  const board = movedBoard(state.board, move);
  if (isCheck({ board }, state.turn)) throw new Error('자기 궁이 장군에 노출되는 수는 둘 수 없습니다.');
  const record: MoveRecord = {
    from: { ...move.from }, to: { ...move.to }, piece, captured,
    isPass: false, side: state.turn,
  };
  return finishTurn(state, board, record);
}

export function pass(state: GameState): GameState {
  assertPlaying(state);
  if (isCheck(state, state.turn)) throw new Error('장군을 받은 동안에는 한 수 쉴 수 없습니다.');
  return finishTurn(state, state.board, {
    from: null, to: null, piece: null, captured: null, isPass: true, side: state.turn,
  });
}

/** Reverse a recorded ply using its complete capture record; snapshots never enter engine state. */
export function undo(state: GameState): GameState {
  const last = state.moveHistory.at(-1);
  if (!last) return state.result ? { ...state, result: null } : state;
  const board = [...state.board];
  if (!last.isPass && last.from && last.to) {
    board[toIndex(last.from)] = last.piece;
    board[toIndex(last.to)] = last.captured;
  }
  return {
    ...state, board, turn: last.side,
    moveHistory: state.moveHistory.slice(0, -1),
    capturedPieces: last.captured ? state.capturedPieces.slice(0, -1) : state.capturedPieces,
    positionHistory: state.positionHistory.slice(0, -1),
    result: null,
  };
}

/** Perft counts legal board moves only; pass is deliberately excluded. Terminal nodes have no children. */
export function perft(state: GameState, depth: number): number {
  if (!Number.isInteger(depth) || depth < 0) throw new Error('깊이는 0 이상의 정수여야 합니다.');
  if (depth === 0) return 1;
  const moves = generateLegalMoves(state);
  if (depth === 1) return moves.length;
  let count = 0;
  for (const move of moves) count += perft(makeMove(state, move), depth - 1);
  return count;
}
