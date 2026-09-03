export type Side = 'HAN' | 'CHO'

export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL'

export type PieceSetup = 'MA_SANG_MA_SANG' | 'SANG_MA_SANG_MA' | 'MA_SANG_SANG_MA' | 'SANG_MA_MA_SANG'

export interface Position {
  file: number
  rank: number
}

export interface Piece {
  side: Side
  type: PieceType
}

export type Board = readonly (Piece | null)[]

export interface Move {
  from: Position | null
  to: Position | null
  piece: Piece | null
  captured: Piece | null
  isPass: boolean
}

export interface GameConfig {
  hanSetup: PieceSetup
  choSetup: PieceSetup
  bikjangEnabled: boolean
  repetitionLimit: number
}

export interface GameState {
  board: Board
  turn: Side
  moveHistory: readonly Move[]
  capturedPieces: readonly Piece[]
  config: GameConfig
  positionHistory: readonly string[]
}

export const PIECE_SETUPS: readonly PieceSetup[] = [
  'MA_SANG_MA_SANG',
  'SANG_MA_SANG_MA',
  'MA_SANG_SANG_MA',
  'SANG_MA_MA_SANG',
]

export const DEFAULT_GAME_CONFIG: GameConfig = {
  hanSetup: 'MA_SANG_MA_SANG',
  choSetup: 'MA_SANG_MA_SANG',
  bikjangEnabled: true,
  repetitionLimit: 3,
}
