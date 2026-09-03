import {
  boardKey,
  createInitialBoard,
  getPiece,
  indexFromPosition,
  otherSide,
  positionFromIndex,
} from './board'
import { generatePieceMoves } from './moves'
import type {
  Board,
  GameConfig,
  GameState,
  HorseElephantSetup,
  Move,
  MoveRecord,
  Piece,
  Position,
  Side,
} from './types'

export const DEFAULT_GAME_CONFIG: GameConfig = {
  bikjangEnabled: true,
  repetitionLimit: 3,
}

export function positionKey(board: Board, turn: Side): string {
  return `${turn}:${boardKey(board)}`
}

export function createGameState(
  board: Board,
  turn: Side,
  config: GameConfig = DEFAULT_GAME_CONFIG,
  initialBoard: Board = board,
): GameState {
  const stableBoard = [...board]
  const stableInitialBoard = [...initialBoard]
  return {
    board: stableBoard,
    turn,
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config,
    positionHistory: [positionKey(stableBoard, turn)],
    initialBoard: stableInitialBoard,
  }
}

export function createInitialGameState(
  hanSetup: HorseElephantSetup = 'MA-SANG-MA-SANG',
  choSetup: HorseElephantSetup = 'MA-SANG-MA-SANG',
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameState {
  const initialBoard = createInitialBoard(hanSetup, choSetup)
  return createGameState(initialBoard, 'CHO', config, initialBoard)
}

export function findGungPosition(board: Board, side: Side): Position | null {
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece?.side === side && piece.type === 'GUNG') return positionFromIndex(index)
  }
  return null
}

export function isAttacked(board: Board, position: Position, bySide: Side): boolean {
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece?.side !== bySide) continue
    const source = positionFromIndex(index)
    if (generatePieceMoves(board, source).some((move) => move.file === position.file && move.rank === position.rank)) {
      return true
    }
  }
  return false
}

export function isCheck(state: GameState, side: Side): boolean {
  const gungPosition = findGungPosition(state.board, side)
  return gungPosition !== null && isAttacked(state.board, gungPosition, otherSide(side))
}

export function generateLegalMoves(state: GameState): Move[] {
  const legalMoves: Move[] = []
  for (let index = 0; index < state.board.length; index += 1) {
    const piece = state.board[index]
    if (piece === null || piece.side !== state.turn) continue
    const from = positionFromIndex(index)
    for (const to of generatePieceMoves(state.board, from)) {
      const captured = getPiece(state.board, to)
      if (captured?.type === 'GUNG') continue
      const move: Move = { from, to, piece, captured, isPass: false }
      const nextState = makeMove(state, move)
      if (!isCheck(nextState, state.turn)) legalMoves.push(move)
    }
  }
  return legalMoves
}

export function makeMove(state: GameState, move: Move): GameState {
  const fromIndex = indexFromPosition(move.from)
  const toIndex = indexFromPosition(move.to)
  const sourcePiece = state.board[fromIndex]
  const targetPiece = state.board[toIndex]
  if (sourcePiece === null || sourcePiece.side !== state.turn) {
    throw new Error('The move source does not contain the side to move')
  }
  if (targetPiece?.type === 'GUNG') {
    throw new Error('A king cannot be captured')
  }

  const nextBoard = [...state.board]
  nextBoard[fromIndex] = null
  nextBoard[toIndex] = sourcePiece
  const captured = targetPiece ?? null
  const nextCapturedPieces: Record<Side, ReadonlyArray<Piece>> = {
    HAN: [...state.capturedPieces.HAN],
    CHO: [...state.capturedPieces.CHO],
  }
  if (captured !== null) {
    nextCapturedPieces[state.turn] = [...nextCapturedPieces[state.turn], captured]
  }
  const playedMove: Move = {
    from: move.from,
    to: move.to,
    piece: sourcePiece,
    captured,
    isPass: false,
  }
  const nextTurn = otherSide(state.turn)
  return {
    ...state,
    board: nextBoard,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, playedMove],
    capturedPieces: nextCapturedPieces,
    positionHistory: [...state.positionHistory, positionKey(nextBoard, nextTurn)],
  }
}

export function pass(state: GameState): GameState {
  if (isCheck(state, state.turn)) {
    throw new Error('A side in check must make a move that resolves check')
  }
  const nextTurn = otherSide(state.turn)
  const passMove: MoveRecord = { from: null, to: null, piece: null, captured: null, isPass: true }
  return {
    ...state,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, passMove],
    positionHistory: [...state.positionHistory, positionKey(state.board, nextTurn)],
  }
}

export function replayState(initialState: GameState, moves: ReadonlyArray<MoveRecord>, count: number): GameState {
  let replayed = createGameState(initialState.initialBoard, 'CHO', initialState.config, initialState.initialBoard)
  const end = Math.max(0, Math.min(count, moves.length))
  for (let index = 0; index < end; index += 1) {
    const move = moves[index]
    replayed = move.isPass ? pass(replayed) : makeMove(replayed, move)
  }
  return replayed
}