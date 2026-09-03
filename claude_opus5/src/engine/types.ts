/**
 * 장기 엔진 — 핵심 타입.
 *
 * 이 폴더(src/engine)는 순수 함수만 담는다. React / DOM / 브라우저 API 참조 금지.
 * 근거 문서: RULES.md
 */

/** 진영. 한(漢)은 위쪽(rank 1~4), 초(楚)는 아래쪽(rank 7~10). 초가 선수. */
export type Side = 'HAN' | 'CHO';

/** 기물 종류. 졸(卒)과 병(兵)은 같은 기물이며 진영에 따라 표기만 다르다. */
export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL';

export interface Piece {
  readonly type: PieceType;
  readonly side: Side;
}

/** 교차점 좌표. file 1~9 (왼→오), rank 1~10 (위→아래). */
export interface Position {
  readonly file: number;
  readonly rank: number;
}

/** 한 교차점의 내용. 비어 있으면 null. */
export type Square = Piece | null;

/** 길이 90의 1차원 배열. index = (rank - 1) * 9 + (file - 1). */
export type Board = readonly Square[];

/** 마·상 초기 배치 4종. file 2,3,7,8 에 놓이는 기물 순서를 뜻한다. */
export type HorseSetup = 'MSMS' | 'SMSM' | 'MSSM' | 'SMMS';

export const HORSE_SETUPS: readonly HorseSetup[] = ['MSMS', 'SMSM', 'MSSM', 'SMMS'];

/** 한 수. isPass가 true면 from/to는 의미 없다(placeholder). */
export interface Move {
  readonly from: Position;
  readonly to: Position;
  /** 움직인 기물의 종류. pass면 null. */
  readonly piece: PieceType | null;
  readonly side: Side;
  /** 잡힌 기물의 종류. 없으면 null. 잡힌 기물의 진영은 항상 side의 상대편. */
  readonly captured: PieceType | null;
  readonly isPass: boolean;
}

export interface GameConfig {
  /** 빅장(양 궁 대면)을 비김으로 처리할지 여부. RULES.md: 기본 on. */
  readonly bikjangEnabled: boolean;
  /** 같은 국면이 이 횟수만큼 나타나면 비김. */
  readonly repetitionLimit: number;
  /** 한(漢) 진영이 후수 보상으로 받는 덤. RULES.md: 1.5점. */
  readonly hanBonus: number;
  /** 이 수(플라이) 수를 넘으면 무승부 처리. 무한 대국 방지용. */
  readonly maxPlies: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  bikjangEnabled: true,
  repetitionLimit: 3,
  hanBonus: 1.5,
  maxPlies: 400,
};

/**
 * 대국 상태. 전부 불변으로 다룬다. makeMove는 새 GameState를 반환한다.
 *
 * capturedPieces[side] = 그 진영이 "잡은" 상대 기물 목록.
 * positionKeys = 초기 국면부터의 (보드 + 차례) 해시 목록. 반복 판정에 쓴다.
 */
export interface GameState {
  readonly board: Board;
  readonly turn: Side;
  readonly moveHistory: readonly Move[];
  readonly capturedPieces: Readonly<Record<Side, readonly PieceType[]>>;
  readonly config: GameConfig;
  readonly positionKeys: readonly string[];
  readonly setup: Readonly<Record<Side, HorseSetup>>;
}

/** RULES.md 「점수」 — 차13 포7 마5 상3 사3 졸2 궁0. */
export const PIECE_VALUES: Readonly<Record<PieceType, number>> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
};

export const OPPONENT: Readonly<Record<Side, Side>> = { HAN: 'CHO', CHO: 'HAN' };

export function opponent(side: Side): Side {
  return OPPONENT[side];
}
