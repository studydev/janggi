export type Side = 'HAN' | 'CHO';
export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL';
export interface Position { readonly file: number; readonly rank: number }
export interface Piece { readonly id: string; readonly side: Side; readonly type: PieceType }
export type Board = readonly (Piece | null)[];
export type Setup = 'MASANGMASANG' | 'SANGMASANGMA' | 'MASANGSANGMA' | 'SANGMAMASANG';
export interface GameConfig { readonly bikjang: boolean; readonly repetitionCount: number }
export interface Move { readonly from: Position; readonly to: Position }
export interface MoveRecord {
  readonly from: Position | null;
  readonly to: Position | null;
  readonly piece: Piece | null;
  readonly captured: Piece | null;
  readonly isPass: boolean;
  readonly side: Side;
}
export interface GameResult {
  readonly status: 'PLAYING' | 'CHECKMATE' | 'DRAW_BY_SCORE' | 'RESIGNED';
  readonly winner: Side | null;
  readonly reason: string;
}
export interface GameState {
  readonly board: Board;
  readonly turn: Side;
  readonly moveHistory: readonly MoveRecord[];
  readonly capturedPieces: readonly Piece[];
  readonly config: GameConfig;
  readonly positionHistory: readonly string[];
  readonly hanSetup: Setup;
  readonly choSetup: Setup;
  readonly result: GameResult | null;
}
