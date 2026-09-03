export type Side = 'HAN' | 'CHO';

export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL';

export interface Piece {
  readonly side: Side;
  readonly type: PieceType;
}

/** file 1~9 (왼쪽→오른쪽), rank 1~10 (위→아래). 기물은 교차점에 놓인다. */
export interface Position {
  readonly file: number;
  readonly rank: number;
}

export type Square = Piece | null;

/** 길이 90의 1차원 배열. index = (rank - 1) * 9 + (file - 1) */
export type Board = readonly Square[];

/** 마·상 배치. 왼쪽부터 file 2, 3, 7, 8 순서. M = 마, S = 상 */
export type SetupCode = 'MSMS' | 'SMSM' | 'MSSM' | 'SMMS';

export interface GameConfig {
  /** 빅장을 무승부 조건으로 처리할지 */
  readonly bikjangDraw: boolean;
  /** 같은 국면이 이 횟수만큼 나오면 무승부 */
  readonly repetitionLimit: number;
  /** 한(漢)의 후수 보상 점수 */
  readonly hanBonus: number;
}

export interface Move {
  readonly from: Position;
  readonly to: Position;
  readonly piece: PieceType;
  readonly side: Side;
  readonly captured: PieceType | null;
  readonly isPass: boolean;
}

/** 착수 요청. 규칙 판정 전의 최소 정보. */
export interface MoveInput {
  readonly from: Position;
  readonly to: Position;
}

export interface GameState {
  readonly board: Board;
  readonly turn: Side;
  readonly moveHistory: readonly Move[];
  /** 각 진영이 "잡아낸" 기물 목록 */
  readonly capturedPieces: Readonly<Record<Side, readonly PieceType[]>>;
  readonly config: GameConfig;
  /** 국면 반복 감지용: boardKey(board, turn) → 등장 횟수 */
  readonly positionCounts: Readonly<Record<string, number>>;
  readonly setup: Readonly<Record<Side, SetupCode>>;
}

export const DEFAULT_CONFIG: GameConfig = {
  bikjangDraw: true,
  repetitionLimit: 3,
  hanBonus: 1.5,
};

export const PIECE_VALUES: Readonly<Record<PieceType, number>> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
};

export const SETUP_CODES: readonly SetupCode[] = ['MSMS', 'SMSM', 'MSSM', 'SMMS'];

export const SETUP_LABELS: Readonly<Record<SetupCode, string>> = {
  MSMS: '마상마상',
  SMSM: '상마상마',
  MSSM: '마상상마',
  SMMS: '상마마상',
};
