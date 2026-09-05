import { createEmptyBoard, createInitialState, hashPosition, positionToIndex } from './board'
import type { Board, GameConfig, GameState, PieceType, Position, Side } from './types'

export type Placement = readonly [file: number, rank: number, type: PieceType, side?: Side]

export function makeBoard(...placements: Placement[]): Board {
  const board = [...createEmptyBoard()]
  for (const [file, rank, type, side = 'CHO'] of placements) {
    board[positionToIndex({ file, rank })] = { id: `${side}-${type}-${file}-${rank}`, type, side }
  }
  return board
}

export function makeState(board: Board, turn: Side = 'CHO', config: Partial<GameConfig> = {}): GameState {
  return {
    ...createInitialState('MSMS', 'MSMS', { bikjangEnabled: false, ...config }),
    board, turn, positionHistory: [hashPosition(board, turn)],
  }
}

export function hasPosition(positions: Position[], file: number, rank: number): boolean {
  return positions.some((position) => position.file === file && position.rank === rank)
}