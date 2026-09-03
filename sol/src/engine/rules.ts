import {
  getPiece,
  hashPosition,
  indexToPosition,
  oppositeSide,
  positionToIndex,
  samePosition,
} from './board'
import { generatePseudoMoves } from './moves'
import type { Board, GameState, LegalMove, Move, MoveInput, Position, Side } from './types'

function moveBoardUnchecked(board: Board, from: Position, to: Position): Board {
  const nextBoard = [...board]
  nextBoard[positionToIndex(to)] = nextBoard[positionToIndex(from)]
  nextBoard[positionToIndex(from)] = null
  return nextBoard
}

function findGung(board: Board, side: Side): Position | null {
  const index = board.findIndex((piece) => piece?.side === side && piece.type === 'GUNG')
  return index < 0 ? null : indexToPosition(index)
}

export function isAttacked(board: Board, position: Position, bySide: Side): boolean {
  return board.some((piece, index) => {
    if (!piece || piece.side !== bySide) return false
    return generatePseudoMoves(board, indexToPosition(index)).some((target) =>
      samePosition(target, position),
    )
  })
}

function isSideInCheck(board: Board, side: Side): boolean {
  const gungPosition = findGung(board, side)
  if (!gungPosition) return true
  return isAttacked(board, gungPosition, oppositeSide(side))
}

export function isCheck(state: GameState, side: Side): boolean {
  return isSideInCheck(state.board, side)
}

function generatePseudoLegalMoves(board: Board, side: Side): LegalMove[] {
  return board.flatMap((piece, index) => {
    if (!piece || piece.side !== side) return []
    const from = indexToPosition(index)
    return generatePseudoMoves(board, from).map((to) => ({
      from,
      to,
      piece,
      captured: getPiece(board, to),
    }))
  })
}

export function generateLegalMoves(state: GameState, side: Side = state.turn): LegalMove[] {
  return generatePseudoLegalMoves(state.board, side).filter((move) => {
    if (move.captured?.type === 'GUNG') return false
    const nextBoard = moveBoardUnchecked(state.board, move.from, move.to)
    return !isSideInCheck(nextBoard, side)
  })
}

export function getLegalMovesFrom(state: GameState, position: Position): LegalMove[] {
  return generateLegalMoves(state).filter((move) => samePosition(move.from, position))
}

export function makeMove(state: GameState, input: MoveInput): GameState {
  const legalMove = generateLegalMoves(state).find(
    (move) => samePosition(move.from, input.from) && samePosition(move.to, input.to),
  )
  if (!legalMove) throw new Error('둘 수 없는 수입니다.')

  const board = moveBoardUnchecked(state.board, legalMove.from, legalMove.to)
  const turn = oppositeSide(state.turn)
  const move: Move = {
    ...legalMove,
    isPass: false,
  }
  return {
    ...state,
    board,
    turn,
    moveHistory: [...state.moveHistory, move],
    capturedPieces: legalMove.captured
      ? [...state.capturedPieces, legalMove.captured]
      : state.capturedPieces,
    positionHistory: [...state.positionHistory, hashPosition(board, turn)],
  }
}

export function pass(state: GameState): GameState {
  if (isCheck(state, state.turn)) throw new Error('장군 상태에서는 한 수 쉴 수 없습니다.')
  const turn = oppositeSide(state.turn)
  const move: Move = {
    from: null,
    to: null,
    piece: null,
    captured: null,
    isPass: true,
  }
  return {
    ...state,
    turn,
    moveHistory: [...state.moveHistory, move],
    positionHistory: [...state.positionHistory, hashPosition(state.board, turn)],
  }
}

export function undoMove(state: GameState): GameState {
  const move = state.moveHistory.at(-1)
  if (!move) return state

  let board = state.board
  if (!move.isPass && move.from && move.to && move.piece) {
    const restored = [...state.board]
    restored[positionToIndex(move.from)] = move.piece
    restored[positionToIndex(move.to)] = move.captured
    board = restored
  }

  return {
    ...state,
    board,
    turn: oppositeSide(state.turn),
    moveHistory: state.moveHistory.slice(0, -1),
    capturedPieces: move.captured ? state.capturedPieces.slice(0, -1) : state.capturedPieces,
    positionHistory: state.positionHistory.slice(0, -1),
  }
}