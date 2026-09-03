/**
 * 합법수 필터, 장군 판정, 착수 적용.
 * 근거 문서: RULES.md 「대국 진행」
 *
 * 핵심 원칙: 공격 판정은 이동 생성기를 그대로 재사용한다.
 * 특히 포(包)의 공격은 이동과 완전히 같은 규칙(포대 정확히 1개)이므로
 * 절대로 따로 구현하지 않는다.
 */
import {
  BOARD_SIZE,
  findGung,
  fromIndex,
  pieceAt,
  positionKey,
  samePos,
  toIndex,
} from './board';
import { generatePseudoMovesFrom, mayReach } from './moves';
import { opponent, type Board, type GameState, type Move, type Position, type Side, type Square } from './types';

/** 한 수 쉬기의 from/to 자리표시자. 보드 밖 좌표이므로 실제 지점과 겹치지 않는다. */
export const PASS_POSITION: Position = { file: 0, rank: 0 };

/* ------------------------------------------------------------------ */
/* 공격 / 장군                                                          */
/* ------------------------------------------------------------------ */

/**
 * target 지점이 bySide 진영에게 공격받고 있는가.
 * 모든 기물의 이동 생성기를 재사용한다(mayReach 는 순수 성능 필터).
 */
export function isAttacked(board: Board, target: Position, bySide: Side): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = board[i];
    if (sq === null || sq === undefined || sq.side !== bySide) continue;
    const from = fromIndex(i);
    if (!mayReach(sq.type, from, target)) continue;
    for (const to of generatePseudoMovesFrom(board, from)) {
      if (samePos(to, target)) return true;
    }
  }
  return false;
}

/** side 진영의 궁이 장군을 받고 있는가. */
export function isCheckOnBoard(board: Board, side: Side): boolean {
  const gung = findGung(board, side);
  if (gung === null) return false; // 궁이 없으면 이미 대국이 끝난 상태다.
  return isAttacked(board, gung, opponent(side));
}

export function isCheck(state: GameState, side: Side = state.turn): boolean {
  return isCheckOnBoard(state.board, side);
}

/* ------------------------------------------------------------------ */
/* 착수 적용                                                            */
/* ------------------------------------------------------------------ */

/** 보드 한 장만 바꾼다. 규칙 검사는 하지 않는다. */
function applyBoardMove(board: Board, from: Position, to: Position): Board {
  const next: Square[] = board.slice();
  const moving = next[toIndex(from)] ?? null;
  next[toIndex(from)] = null;
  next[toIndex(to)] = moving;
  return next;
}

/* ------------------------------------------------------------------ */
/* 합법수                                                              */
/* ------------------------------------------------------------------ */

/**
 * 의사이동 중 「두고 나서 자기 궁이 장군에 걸리는 수」를 제거한 목록.
 * RULES.md: 「자기 궁이 장군에 노출되는 수는 둘 수 없다.」
 *
 * 한 수 쉬기(pass)는 여기에 포함하지 않는다. 별도의 pass() 로 다룬다.
 */
export function generateLegalMoves(state: GameState, side: Side = state.turn): Move[] {
  const board = state.board;
  const out: Move[] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = board[i];
    if (sq === null || sq === undefined || sq.side !== side) continue;
    const from = fromIndex(i);

    for (const to of generatePseudoMovesFrom(board, from)) {
      const target = pieceAt(board, to);
      const nextBoard = applyBoardMove(board, from, to);
      if (isCheckOnBoard(nextBoard, side)) continue;
      out.push({
        from,
        to,
        piece: sq.type,
        side,
        captured: target === null ? null : target.type,
        isPass: false,
      });
    }
  }
  return out;
}

/** UI 용: 특정 지점의 기물이 실제로 갈 수 있는 지점들. */
export function generateLegalDestinations(state: GameState, from: Position): Position[] {
  const piece = pieceAt(state.board, from);
  if (piece === null || piece.side !== state.turn) return [];
  return generateLegalMoves(state)
    .filter((m) => samePos(m.from, from))
    .map((m) => m.to);
}

export function findLegalMove(state: GameState, from: Position, to: Position): Move | null {
  return generateLegalMoves(state).find((m) => samePos(m.from, from) && samePos(m.to, to)) ?? null;
}

export function isLegalMove(state: GameState, from: Position, to: Position): boolean {
  return findLegalMove(state, from, to) !== null;
}

/* ------------------------------------------------------------------ */
/* 상태 전이                                                            */
/* ------------------------------------------------------------------ */

/**
 * 새 GameState 를 반환한다. 원본은 절대 바꾸지 않는다.
 * move 는 합법수라고 가정한다. 검증이 필요하면 tryMove 를 쓴다.
 */
export function makeMove(state: GameState, move: Move): GameState {
  if (move.isPass) return pass(state);

  const captured = pieceAt(state.board, move.to);
  const board = applyBoardMove(state.board, move.from, move.to);
  const turn = opponent(state.turn);

  const record: Move = {
    from: move.from,
    to: move.to,
    piece: move.piece,
    side: state.turn,
    captured: captured === null ? null : captured.type,
    isPass: false,
  };

  const capturedPieces = captured
    ? {
        ...state.capturedPieces,
        [state.turn]: [...state.capturedPieces[state.turn], captured.type],
      }
    : state.capturedPieces;

  return {
    ...state,
    board,
    turn,
    moveHistory: [...state.moveHistory, record],
    capturedPieces,
    positionKeys: [...state.positionKeys, positionKey({ board, turn })],
  };
}

/** 좌표로 착수를 시도한다. 합법수가 아니면 null. */
export function tryMove(state: GameState, from: Position, to: Position): GameState | null {
  const move = findLegalMove(state, from, to);
  return move === null ? null : makeMove(state, move);
}

/**
 * 한 수 쉬기. RULES.md 「한 수 쉬기(pass) 허용」
 * 단, 장군을 받은 상태에서는 반드시 멍군해야 하므로 쉴 수 없다.
 */
export function canPass(state: GameState): boolean {
  return !isCheck(state, state.turn);
}

export function pass(state: GameState): GameState {
  const turn = opponent(state.turn);
  const record: Move = {
    from: PASS_POSITION,
    to: PASS_POSITION,
    piece: null,
    side: state.turn,
    captured: null,
    isPass: true,
  };
  return {
    ...state,
    turn,
    moveHistory: [...state.moveHistory, record],
    positionKeys: [...state.positionKeys, positionKey({ board: state.board, turn })],
  };
}

/** 마지막 한 수를 되돌린다. 되돌릴 수가 없으면 그대로 반환한다. */
export function undoMove(state: GameState): GameState {
  const last = state.moveHistory[state.moveHistory.length - 1];
  if (last === undefined) return state;

  const moveHistory = state.moveHistory.slice(0, -1);
  const positionKeys = state.positionKeys.slice(0, -1);
  const turn = last.side;

  if (last.isPass) {
    return { ...state, turn, moveHistory, positionKeys };
  }

  const board: Square[] = state.board.slice();
  board[toIndex(last.from)] = last.piece === null ? null : { type: last.piece, side: last.side };
  board[toIndex(last.to)] =
    last.captured === null ? null : { type: last.captured, side: opponent(last.side) };

  const capturedPieces =
    last.captured === null
      ? state.capturedPieces
      : { ...state.capturedPieces, [last.side]: state.capturedPieces[last.side].slice(0, -1) };

  return { ...state, board, turn, moveHistory, capturedPieces, positionKeys };
}
