/**
 * 합법수 필터, 장군 판정, 착수 적용.
 *
 * RULES.md:
 *  - 자기 궁이 장군에 노출되는 수는 둘 수 없다.
 *  - 장군을 받으면 반드시 해소해야 한다 (해소 못하면 외통 → result.ts).
 *  - 한 수 쉬기(pass) 허용. 단, 장군 중에는 쉴 수 없다 (반드시 해소해야 하므로).
 *
 * 포의 공격 판정은 이동 판정과 같은 함수(generatePoMoves)를 재사용하므로
 * 규칙이 갈라지지 않는다.
 */

import { createInitialState, fromIndex, opponent, pieceAt, posEquals, setPiece } from './board'
import { generatePseudoMoves, generatePseudoMovesForSide } from './moves'
import type { Board, GameConfig, GameState, Move, Piece, Position, Side } from './types'

const PASS_MOVE: Move = { from: null, to: null, piece: null, captured: null, isPass: true }

export function findGung(board: Board, side: Side): Position | null {
  for (let i = 0; i < board.length; i += 1) {
    const p = board[i]
    if (p !== null && p.side === side && p.type === 'GUNG') return fromIndex(i)
  }
  return null
}

/** 해당 지점이 bySide 에게 공격받는가. 모든 기물의 의사이동 생성기를 재사용한다. */
export function isAttacked(board: Board, target: Position, bySide: Side): boolean {
  for (let i = 0; i < board.length; i += 1) {
    const p = board[i]
    if (p === null || p.side !== bySide) continue
    const from = fromIndex(i)
    for (const to of generatePseudoMoves(board, from)) {
      if (posEquals(to, target)) return true
    }
  }
  return false
}

/** side 진영의 궁이 공격받고 있는가 (장군). 궁이 없으면 진 것으로 본다. */
export function isCheck(board: Board, side: Side): boolean {
  const gung = findGung(board, side)
  return gung === null || isAttacked(board, gung, opponent(side))
}

/** from → to 로 기물을 옮긴 새 보드 (규칙 검증 없음). */
function movePiece(board: Board, from: Position, to: Position, piece: Piece): Board {
  return setPiece(setPiece(board, from, null), to, piece)
}

function toMove(board: Board, from: Position, to: Position): Move {
  const piece = pieceAt(board, from)
  if (piece === null) throw new Error(`이동 출발점에 기물이 없다: ${from.file},${from.rank}`)
  return { from, to, piece, captured: pieceAt(board, to), isPass: false }
}

/**
 * 현재 차례가 둘 수 있는 모든 합법수.
 * = 의사이동 중 "두고 나서 자기 궁이 장군에 걸리는 수"와
 *   "상대 궁을 잡는 수"(정상 대국에서는 도달 불가)를 제거한 것.
 * pass 는 포함하지 않는다 (별도 함수).
 */
export function generateLegalMoves(state: GameState): Move[] {
  const { board, turn } = state
  const legal: Move[] = []
  for (const { from, to } of generatePseudoMovesForSide(board, turn)) {
    const target = pieceAt(board, to)
    if (target !== null && target.type === 'GUNG') continue

    const move = toMove(board, from, to)
    const next = movePiece(board, from, to, move.piece!)
    if (!isCheck(next, turn)) legal.push(move)
  }
  return legal
}

export function isLegalMove(state: GameState, from: Position, to: Position): boolean {
  return generateLegalMoves(state).some(
    (m) => m.from !== null && m.to !== null && posEquals(m.from, from) && posEquals(m.to, to),
  )
}

function advance(state: GameState, move: Move, board: Board): GameState {
  return {
    ...state,
    board,
    turn: opponent(state.turn),
    moveHistory: [...state.moveHistory, move],
    capturedPieces: move.captured === null ? state.capturedPieces : [...state.capturedPieces, move.captured],
  }
}

/** 합법수를 두어 새 GameState 를 반환한다. 원본 불변. */
export function makeMove(state: GameState, from: Position, to: Position): GameState {
  const move = generateLegalMoves(state).find(
    (m) => m.from !== null && m.to !== null && posEquals(m.from, from) && posEquals(m.to, to),
  )
  if (move === undefined || move.piece === null || move.from === null || move.to === null) {
    throw new Error(`합법수가 아니다: ${from.file},${from.rank} → ${to.file},${to.rank}`)
  }
  return advance(state, move, movePiece(state.board, move.from, move.to, move.piece))
}

/**
 * 이미 합법으로 확인된 수를 재검증 없이 적용한다 (perft·랜덤 대국·리듀서 내부용).
 * UI 입력은 makeMove 를 쓴다.
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (move.isPass) return advance(state, PASS_MOVE, state.board)
  if (move.from === null || move.to === null || move.piece === null) {
    throw new Error('불완전한 수는 적용할 수 없다.')
  }
  return advance(state, move, movePiece(state.board, move.from, move.to, move.piece))
}

/** 한 수 쉬기. 장군 중에는 쉴 수 없다. */
export function pass(state: GameState): GameState {
  if (isCheck(state.board, state.turn)) {
    throw new Error('장군 중에는 한 수 쉬기를 할 수 없다.')
  }
  return advance(state, PASS_MOVE, state.board)
}

export function canPass(state: GameState): boolean {
  return !isCheck(state.board, state.turn)
}

// ---------------------------------------------------------------------------
// Replay / undo — 저장된 기록을 신뢰해 국면을 재구성한다 (합법성 재검증 없음).
// 불러온 기보와 리플레이 스크러빙에도 쓰인다.
// ---------------------------------------------------------------------------

function replayOne(state: GameState, recorded: Move): GameState {
  if (recorded.isPass) return advance(state, PASS_MOVE, state.board)
  if (recorded.from === null || recorded.to === null) throw new Error('불완전한 수는 재생할 수 없다.')

  const piece = pieceAt(state.board, recorded.from) ?? recorded.piece
  if (piece === null) throw new Error('재생할 수의 기물을 찾을 수 없다.')

  const move: Move = { ...recorded, piece, captured: pieceAt(state.board, recorded.to) }
  return advance(state, move, movePiece(state.board, recorded.from, recorded.to, piece))
}

export function replayHistory(config: GameConfig, moves: readonly Move[]): GameState {
  let state = createInitialState(config)
  for (const move of moves) state = replayOne(state, move)
  return state
}

/** [초기 국면, 1수 후, 2수 후, ...] 모든 중간 국면. */
export function replayStates(config: GameConfig, moves: readonly Move[]): GameState[] {
  const states = [createInitialState(config)]
  for (const move of moves) states.push(replayOne(states[states.length - 1], move))
  return states
}

/** 처음부터 count 수까지 두었을 때의 국면. */
export function stateAtMove(game: GameState, count: number): GameState {
  const clamped = Math.max(0, Math.min(count, game.moveHistory.length))
  return replayHistory(game.config, game.moveHistory.slice(0, clamped))
}

/** 마지막 한 수 무르기. */
export function undoMove(state: GameState): GameState {
  return replayHistory(state.config, state.moveHistory.slice(0, -1))
}
