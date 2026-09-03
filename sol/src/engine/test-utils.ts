import { createEmptyBoard, DEFAULT_CONFIG, hashPosition, setPiece } from './board'
import type { Board, GameState, Piece, PieceType, Position, Side } from './types'

interface Placement {
  readonly position: Position
  readonly type: PieceType
  readonly side: Side
}

export function makeTestPiece(type: PieceType, side: Side, id = `${side}-${type}`): Piece {
  return { id, type, side }
}

export function makeTestBoard(placements: readonly Placement[]): Board {
  return placements.reduce<Board>(
    (board, placement, index) =>
      setPiece(
        board,
        placement.position,
        makeTestPiece(placement.type, placement.side, `${placement.side}-${placement.type}-${index}`),
      ),
    createEmptyBoard(),
  )
}

export function hasPosition(positions: readonly Position[], target: Position): boolean {
  return positions.some((position) => position.file === target.file && position.rank === target.rank)
}

export function makeTestState(board: Board, turn: Side = 'CHO'): GameState {
  return {
    board,
    turn,
    moveHistory: [],
    capturedPieces: [],
    positionHistory: [hashPosition(board, turn)],
    config: DEFAULT_CONFIG,
  }
}

