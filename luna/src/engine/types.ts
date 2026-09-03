export const BOARD_FILES = 9
export const BOARD_RANKS = 10
export const BOARD_SIZE = BOARD_FILES * BOARD_RANKS

export type Side = 'HAN' | 'CHO'
export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL'

export interface Position {
  readonly file: number
  readonly rank: number
}

export interface Piece {
  readonly id: string
  readonly side: Side
  readonly type: PieceType
}

export type Board = ReadonlyArray<Piece | null>

export const HORSE_ELEPHANT_SETUP_OPTIONS = [
  'MA-SANG-MA-SANG',
  'SANG-MA-SANG-MA',
  'MA-SANG-SANG-MA',
  'SANG-MA-MA-SANG',
] as const

export type HorseElephantSetup = (typeof HORSE_ELEPHANT_SETUP_OPTIONS)[number]

export interface GameConfig {
  readonly bikjangEnabled: boolean
  readonly repetitionLimit: number
}

export interface Move {
  readonly from: Position
  readonly to: Position
  readonly piece: Piece
  readonly captured: Piece | null
  readonly isPass: false
}

export interface PassMove {
  readonly from: null
  readonly to: null
  readonly piece: null
  readonly captured: null
  readonly isPass: true
}

export type MoveRecord = Move | PassMove

export interface GameState {
  readonly board: Board
  readonly turn: Side
  readonly moveHistory: ReadonlyArray<MoveRecord>
  readonly capturedPieces: Readonly<Record<Side, ReadonlyArray<Piece>>>
  readonly config: GameConfig
  readonly positionHistory: ReadonlyArray<string>
  readonly initialBoard: Board
}

export type GameStatus =
  | 'PLAYING'
  | 'CHECKMATE'
  | 'DRAW_BY_BIKJANG'
  | 'DRAW_BY_REPETITION'
  | 'DRAW_BY_SCORE'

export interface GameResult {
  readonly status: GameStatus
  readonly winner: Side | null
  readonly loser: Side | null
  readonly reason: string
}