import {
  getPiece,
  indexToPosition,
  oppositeSide,
  positionHash,
  positionToIndex,
} from './board'
import { generatePseudoMoves } from './moves'
import type {
  Board,
  GameState,
  LegalMove,
  Move,
  MoveRecord,
  Position,
  Side,
} from './types'

export function samePosition(left: Position, right: Position): boolean {
  return left.file === right.file && left.rank === right.rank
}

export function findGeneral(board: Board, side: Side): Position | null {
  const index = board.findIndex((piece) => piece?.side === side && piece.type === 'GUNG')
  return index === -1 ? null : indexToPosition(index)
}

export function isAttacked(board: Board, position: Position, bySide: Side): boolean {
  return board.some((piece, index) => {
    if (!piece || piece.side !== bySide) return false
    return generatePseudoMoves(board, indexToPosition(index))
      .some((destination) => samePosition(destination, position))
  })
}

export function isCheck(state: GameState, side: Side): boolean {
  const general = findGeneral(state.board, side)
  return general === null || isAttacked(state.board, general, oppositeSide(side))
}

function boardAfterMove(board: Board, move: Move): Board {
  const nextBoard = [...board]
  const piece = getPiece(board, move.from)
  nextBoard[positionToIndex(move.from)] = null
  nextBoard[positionToIndex(move.to)] = piece
  return nextBoard
}

export function generateLegalMoves(state: GameState, side: Side = state.turn): LegalMove[] {
  const moves: LegalMove[] = []

  state.board.forEach((piece, index) => {
    if (!piece || piece.side !== side) return
    const from = indexToPosition(index)

    for (const to of generatePseudoMoves(state.board, from)) {
      const captured = getPiece(state.board, to)
      if (captured?.type === 'GUNG') continue

      const candidate = { from, to }
      const nextBoard = boardAfterMove(state.board, candidate)
      const general = piece.type === 'GUNG' ? to : findGeneral(nextBoard, side)
      if (!general || isAttacked(nextBoard, general, oppositeSide(side))) continue

      moves.push({ from, to, piece, captured })
    }
  })

  return moves
}

export function getLegalMovesFrom(state: GameState, position: Position): LegalMove[] {
  return generateLegalMoves(state).filter((move) => samePosition(move.from, position))
}

function commitMove(state: GameState, move: LegalMove): GameState {
  const board = boardAfterMove(state.board, move)
  const nextTurn = oppositeSide(state.turn)
  const record: MoveRecord = {
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured,
    isPass: false,
  }

  return {
    ...state,
    board,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, record],
    capturedPieces: move.captured
      ? [...state.capturedPieces, move.captured]
      : state.capturedPieces,
    positionHistory: [...state.positionHistory, positionHash(board, nextTurn)],
  }
}

export function makeMove(state: GameState, move: Move): GameState {
  const legalMove = generateLegalMoves(state).find((candidate) => (
    samePosition(candidate.from, move.from) && samePosition(candidate.to, move.to)
  ))
  if (!legalMove) throw new Error('합법적이지 않은 수입니다.')
  return commitMove(state, legalMove)
}

export function passTurn(state: GameState): GameState {
  if (isCheck(state, state.turn)) {
    throw new Error('장군을 받은 상태에서는 한 수 쉴 수 없습니다.')
  }

  const nextTurn = oppositeSide(state.turn)
  const record: MoveRecord = {
    from: null,
    to: null,
    piece: null,
    captured: null,
    isPass: true,
  }
  return {
    ...state,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, record],
    positionHistory: [...state.positionHistory, positionHash(state.board, nextTurn)],
  }
}

export function undoMove(state: GameState): GameState {
  const lastMove = state.moveHistory.at(-1)
  if (!lastMove) return state

  const previousTurn = oppositeSide(state.turn)
  if (lastMove.isPass) {
    return {
      ...state,
      turn: previousTurn,
      moveHistory: state.moveHistory.slice(0, -1),
      positionHistory: state.positionHistory.slice(0, -1),
    }
  }

  if (!lastMove.from || !lastMove.to || !lastMove.piece) return state
  const board = [...state.board]
  board[positionToIndex(lastMove.from)] = lastMove.piece
  board[positionToIndex(lastMove.to)] = lastMove.captured

  return {
    ...state,
    board,
    turn: previousTurn,
    moveHistory: state.moveHistory.slice(0, -1),
    capturedPieces: lastMove.captured
      ? state.capturedPieces.slice(0, -1)
      : state.capturedPieces,
    positionHistory: state.positionHistory.slice(0, -1),
  }
}
