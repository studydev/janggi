export type Side = 'HAN' | 'CHO'

export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL'

export type PieceSetup = 'MSMS' | 'SMSM' | 'MSSM' | 'SMMS'

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

export interface Move {
  readonly from: Position | null
  readonly to: Position | null
  readonly piece: Piece | null
  readonly captured: Piece | null
  readonly isPass: boolean
}

export interface GameConfig {
  readonly bikjangEnabled: boolean
  readonly repetitionCount: number
}

export interface GameState {
  readonly board: Board
  readonly turn: Side
  readonly moveHistory: ReadonlyArray<Move>
  readonly capturedPieces: ReadonlyArray<Piece>
  readonly positionHistory: ReadonlyArray<string>
  readonly config: GameConfig
}

export interface LegalMove {
  readonly from: Position
  readonly to: Position
  readonly piece: Piece
  readonly captured: Piece | null
}

export interface MoveInput {
  readonly from: Position
  readonly to: Position
}
