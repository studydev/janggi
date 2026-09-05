import { getPiece, hashPosition, indexToPosition, oppositeSide, positionToIndex, samePosition } from './board'
import { generatePseudoMoves } from './moves'
import type { Board, GameState, LegalMove, Move, MoveInput, Position, Side } from './types'

function moveBoardUnchecked(board: Board, from: Position, to: Position): Board {
  const next = [...board]
  next[positionToIndex(to)] = next[positionToIndex(from)]
  next[positionToIndex(from)] = null
  return next
}

export function findGung(board: Board, side: Side): Position | null {
  const index = board.findIndex((piece) => piece?.side === side && piece.type === 'GUNG')
  return index < 0 ? null : indexToPosition(index)
}

export function isAttacked(board: Board, position: Position, bySide: Side): boolean {
  return board.some((piece, index) => piece?.side === bySide
    && generatePseudoMoves(board, indexToPosition(index)).some((target) => samePosition(target, position)))
}

function isSideInCheck(board: Board, side: Side): boolean {
  const king = findGung(board, side)
  return !king || isAttacked(board, king, oppositeSide(side))
}

export function isCheck(state: GameState, side: Side): boolean {
  return isSideInCheck(state.board, side)
}

function legalMovesFrom(board: Board, from: Position, side: Side): LegalMove[] {
  const piece = getPiece(board, from)
  if (piece?.side !== side) return []
  return generatePseudoMoves(board, from).flatMap((to) => {
    const captured = getPiece(board, to)
    if (captured?.type === 'GUNG' || isSideInCheck(moveBoardUnchecked(board, from, to), side)) return []
    return [{ from, to, piece, captured }]
  })
}

export function generateLegalMoves(state: GameState, side: Side = state.turn): LegalMove[] {
  return state.board.flatMap((piece, index) => piece?.side === side
    ? legalMovesFrom(state.board, indexToPosition(index), side) : [])
}

export function getLegalMovesFrom(state: GameState, position: Position): LegalMove[] {
  return legalMovesFrom(state.board, position, state.turn)
}

export function makeMove(state: GameState, input: MoveInput): GameState {
  const legal = getLegalMovesFrom(state, input.from).find((move) => samePosition(move.to, input.to))
  if (!legal) throw new Error('Illegal move')
  const board = moveBoardUnchecked(state.board, legal.from, legal.to)
  const turn = oppositeSide(state.turn)
  return {
    ...state, board, turn,
    moveHistory: [...state.moveHistory, { ...legal, isPass: false }],
    capturedPieces: legal.captured ? [...state.capturedPieces, legal.captured] : state.capturedPieces,
    positionHistory: [...state.positionHistory, hashPosition(board, turn)],
  }
}

export function pass(state: GameState): GameState {
  if (isCheck(state, state.turn)) throw new Error('Cannot pass while in check')
  const turn = oppositeSide(state.turn)
  const move: Move = { from: null, to: null, piece: null, captured: null, isPass: true }
  return {
    ...state, turn, moveHistory: [...state.moveHistory, move],
    positionHistory: [...state.positionHistory, hashPosition(state.board, turn)],
  }
}

export function undoMove(state: GameState): GameState {
  const move = state.moveHistory.at(-1)
  if (!move) return state
  let board = state.board
  if (!move.isPass && move.from && move.to && move.piece) {
    const restored = [...board]
    restored[positionToIndex(move.from)] = move.piece
    restored[positionToIndex(move.to)] = move.captured
    board = restored
  }
  return {
    ...state, board, turn: oppositeSide(state.turn),
    moveHistory: state.moveHistory.slice(0, -1),
    capturedPieces: move.captured ? state.capturedPieces.slice(0, -1) : state.capturedPieces,
    positionHistory: state.positionHistory.slice(0, -1),
  }
}