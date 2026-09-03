// 합법수 필터링과 장군 판정. 포함: isAttacked, isCheck, generateLegalMoves, makeMove, pass.
import { opponent, pieceAt, positionKey, toIndex, toPosition } from './board'
import { generatePseudoMoves } from './moves'
import type { Board, GameState, Move, Piece, Position, Side } from './types'

export function findGung(board: Board, side: Side): Position | null {
  for (let i = 0; i < board.length; i++) {
    const piece = board[i]
    if (piece && piece.type === 'GUNG' && piece.side === side) return toPosition(i)
  }
  return null
}

/** pos가 bySide 소속 기물 중 하나에 의해 공격받는 위치인지 검사한다. */
export function isAttacked(board: Board, pos: Position, bySide: Side): boolean {
  for (let i = 0; i < board.length; i++) {
    const piece = board[i]
    if (!piece || piece.side !== bySide) continue
    const from = toPosition(i)
    const moves = generatePseudoMoves(board, from)
    if (moves.some((m) => m.file === pos.file && m.rank === pos.rank)) return true
  }
  return false
}

export function isCheck(state: GameState, side: Side): boolean {
  const gungPos = findGung(state.board, side)
  if (!gungPos) return false
  return isAttacked(state.board, gungPos, opponent(side))
}

function applyMoveToBoard(board: Board, from: Position, to: Position): Board {
  const next = board.slice()
  next[toIndex(to)] = next[toIndex(from)]
  next[toIndex(from)] = null
  return next
}

/**
 * 현재 차례(state.turn) 진영이 둘 수 있는 모든 합법수.
 * 의사이동 중 "두고 나서 자기 궁이 장군에 걸리는 수"를 제거한다.
 */
export function generateLegalMoves(state: GameState): Move[] {
  const side = state.turn
  const legal: Move[] = []
  for (let i = 0; i < state.board.length; i++) {
    const piece = state.board[i]
    if (!piece || piece.side !== side) continue
    const from = toPosition(i)
    for (const to of generatePseudoMoves(state.board, from)) {
      const nextBoard = applyMoveToBoard(state.board, from, to)
      const gungPos = piece.type === 'GUNG' ? to : findGung(nextBoard, side)
      if (gungPos && isAttacked(nextBoard, gungPos, opponent(side))) continue
      legal.push({ from, to, piece, captured: pieceAt(state.board, to), isPass: false })
    }
  }
  return legal
}

/** 특정 기물(pos)이 이동 가능한 목적지 목록만 필요할 때 사용하는 UI 편의 함수. */
export function getLegalMovesFrom(state: GameState, pos: Position): Position[] {
  return generateLegalMoves(state)
    .filter((m) => m.from.file === pos.file && m.from.rank === pos.rank)
    .map((m) => m.to)
}

function withPositionCount(state: GameState, nextBoard: Board, nextTurn: Side): Readonly<Record<string, number>> {
  const key = positionKey(nextBoard, nextTurn)
  return { ...state.positionCounts, [key]: (state.positionCounts[key] ?? 0) + 1 }
}

/** 불변 업데이트: 원본 state는 건드리지 않고 새 GameState를 반환한다. */
export function makeMove(state: GameState, move: Move): GameState {
  const nextBoard = applyMoveToBoard(state.board, move.from, move.to)
  const nextTurn = opponent(state.turn)
  const capturedPiece: Piece | null = move.captured
  const capturedPieces = capturedPiece
    ? { ...state.capturedPieces, [capturedPiece.side]: [...state.capturedPieces[capturedPiece.side], capturedPiece] }
    : state.capturedPieces
  return {
    ...state,
    board: nextBoard,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    capturedPieces,
    positionCounts: withPositionCount(state, nextBoard, nextTurn),
  }
}

/** 장군 상태가 아닐 때만 허용되는 "한 수 쉬기". */
export function canPass(state: GameState): boolean {
  return !isCheck(state, state.turn)
}

export function pass(state: GameState): GameState {
  const side = state.turn
  const gungPos = findGung(state.board, side)
  const piece = gungPos ? pieceAt(state.board, gungPos) : null
  if (!gungPos || !piece) throw new Error('궁을 찾을 수 없어 패스를 기록할 수 없습니다.')
  const move: Move = { from: gungPos, to: gungPos, piece, captured: null, isPass: true }
  const nextTurn = opponent(side)
  return {
    ...state,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    positionCounts: withPositionCount(state, state.board, nextTurn),
  }
}
