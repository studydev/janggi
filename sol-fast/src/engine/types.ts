export type Side = 'HAN' | 'CHO'
export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL'

export type FileNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type RankNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Position {
  readonly file: FileNumber
  readonly rank: RankNumber
}

export interface Piece {
  readonly id: string
  readonly side: Side
  readonly type: PieceType
}

export type Board = ReadonlyArray<Piece | null>

export type Formation =
  | 'MSMS'
  | 'SMSM'
  | 'MSSM'
  | 'SMMS'

export interface GameSetup {
  readonly han: Formation
  readonly cho: Formation
}

export interface GameConfig {
  readonly bikjang: boolean
  readonly repetitionCount: number
}

export interface Move {
  readonly from: Position
  readonly to: Position
}

export interface MoveRecord {
  readonly from: Position | null
  readonly to: Position | null
  readonly piece: Piece | null
  readonly captured: Piece | null
  readonly isPass: boolean
}

export interface GameState {
  readonly board: Board
  readonly turn: Side
  readonly moveHistory: ReadonlyArray<MoveRecord>
  readonly capturedPieces: ReadonlyArray<Piece>
  readonly config: GameConfig
  readonly setup: GameSetup
  readonly positionHistory: ReadonlyArray<string>
}

export interface LegalMove extends Move {
  readonly piece: Piece
  readonly captured: Piece | null
}

export type ResultStatus =
  | 'PLAYING'
  | 'CHECKMATE'
  | 'BIKJANG'
  | 'REPETITION'
  | 'DRAW_BY_SCORE'
  | 'RESIGNED'
  | 'DRAW_AGREED'

export interface GameResult {
  readonly status: ResultStatus
  readonly winner: Side | null
  readonly reason: string
}
