import {
  createInitialState,
  fromIndex,
  getPiece,
  oppositeSide,
  positionKey,
  samePosition,
  withPiece,
} from './board'
import { generatePseudoMovesForSide } from './moves'
import type { Board, GameConfig, GameState, Move, Piece, Position, Side } from './types'

function findGung(board: Board, side: Side): Position | null {
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece?.side === side && piece.type === 'GUNG') {
      return fromIndex(index)
    }
  }
  return null
}

function createMove(board: Board, from: Position, to: Position): Move {
  const piece = getPiece(board, from)
  if (piece === null) {
    throw new Error('A move must start on an occupied position.')
  }

  return {
    from: { ...from },
    to: { ...to },
    piece,
    captured: getPiece(board, to),
    isPass: false,
  }
}

function moveBoard(board: Board, from: Position, to: Position, piece: Piece): Board {
  return withPiece(withPiece(board, from, null), to, piece)
}

function finishTurn(state: GameState, move: Move, board: Board): GameState {
  const nextTurn = oppositeSide(state.turn)
  return {
    ...state,
    board,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    capturedPieces: move.captured === null ? state.capturedPieces : [...state.capturedPieces, move.captured],
    positionHistory: [...state.positionHistory, positionKey(board, nextTurn)],
  }
}

function sameMove(move: Move, from: Position, to: Position): boolean {
  return !move.isPass && move.from !== null && move.to !== null && samePosition(move.from, from) && samePosition(move.to, to)
}

export function isAttacked(board: Board, position: Position, bySide: Side): boolean {
  return generatePseudoMovesForSide(board, bySide).some((move) => samePosition(move.to, position))
}

export function isCheck(state: GameState, side: Side): boolean {
  const gungPosition = findGung(state.board, side)
  return gungPosition === null || isAttacked(state.board, gungPosition, oppositeSide(side))
}

export function generateLegalMoves(state: GameState): Move[] {
  const moves: Move[] = []
  for (const { from, to } of generatePseudoMovesForSide(state.board, state.turn)) {
    const target = getPiece(state.board, to)
    if (target?.type === 'GUNG') {
      continue
    }

    const move = createMove(state.board, from, to)
    const nextBoard = moveBoard(state.board, from, to, move.piece!)
    if (!isCheck({ ...state, board: nextBoard }, state.turn)) {
      moves.push(move)
    }
  }
  return moves
}

export function makeMove(state: GameState, requestedMove: Move): GameState {
  if (requestedMove.isPass) {
    return pass(state)
  }
  if (requestedMove.from === null || requestedMove.to === null) {
    throw new Error('A standard move requires both a source and destination.')
  }

  const legalMove = generateLegalMoves(state).find((move) => sameMove(move, requestedMove.from!, requestedMove.to!))
  if (legalMove === undefined || legalMove.from === null || legalMove.to === null || legalMove.piece === null) {
    throw new Error('The requested move is not legal in this position.')
  }

  return applyLegalMove(state, legalMove)
}

export function applyLegalMove(state: GameState, legalMove: Move): GameState {
  if (legalMove.isPass || legalMove.from === null || legalMove.to === null || legalMove.piece === null) {
    throw new Error('A legal board move requires a source, destination, and piece.')
  }

  return finishTurn(state, legalMove, moveBoard(state.board, legalMove.from, legalMove.to, legalMove.piece))
}

export function pass(state: GameState): GameState {
  if (isCheck(state, state.turn)) {
    throw new Error('A side in check cannot pass.')
  }

  return finishTurn(
    state,
    { from: null, to: null, piece: null, captured: null, isPass: true },
    state.board,
  )
}

function replayMove(state: GameState, move: Move): GameState {
  if (move.isPass) {
    return finishTurn(state, move, state.board)
  }
  if (move.from === null || move.to === null) {
    throw new Error('Cannot replay an incomplete move.')
  }

  const piece = getPiece(state.board, move.from) ?? move.piece
  if (piece === null) {
    throw new Error('Cannot replay a move without its piece.')
  }
  const replayedMove: Move = {
    ...move,
    piece,
    captured: getPiece(state.board, move.to),
  }
  return finishTurn(state, replayedMove, moveBoard(state.board, move.from, move.to, piece))
}

/**
 * Rebuilds a game state by replaying a move list from the initial position.
 * Trusts the structure of each stored move (from/to/isPass) rather than
 * re-deriving legality, so it also works for imported records and replay
 * scrubbing. Throws only if a stored move cannot be placed on the board.
 */
export function replayHistory(config: GameConfig, moves: readonly Move[]): GameState {
  let state = createInitialState(config)
  for (const move of moves) {
    state = replayMove(state, move)
  }
  return state
}

/** State as it stood after the first `count` moves of the given game. */
export function stateAtMove(game: GameState, count: number): GameState {
  const clamped = Math.max(0, Math.min(count, game.moveHistory.length))
  return replayHistory(game.config, game.moveHistory.slice(0, clamped))
}

export function undoMove(state: GameState): GameState {
  return replayHistory(state.config, state.moveHistory.slice(0, -1))
}