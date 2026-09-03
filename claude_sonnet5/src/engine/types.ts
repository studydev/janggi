/**
 * Core data model for the Janggi rules engine.
 *
 * Pure types only — no React, no DOM. See RULES.md for the rules these model.
 */

/** 두 진영. 초(楚, CHO)가 아래쪽·선수, 한(漢, HAN)이 위쪽·후수(덤 1.5점). */
export type Side = 'CHO' | 'HAN'

/** 기물 종류: 궁·사·차·포·마·상·졸(병). */
export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL'

/**
 * 마·상 초기 배치. file 2·3·7·8에 놓이는 기물 순서를 뜻한다.
 * 예) `MSSM` = file2 마, file3 상, file7 상, file8 마.
 */
export type Formation = 'MSMS' | 'SMSM' | 'MSSM' | 'SMMS'

/** 선의 교차점. file: 1~9 (좌→우), rank: 1~10 (위→아래). */
export interface Position {
  readonly file: number
  readonly rank: number
}

export interface Piece {
  readonly side: Side
  readonly type: PieceType
}

/** 90칸(9×10) 1차원 배열. index = (rank-1)*9 + (file-1). */
export type Board = readonly (Piece | null)[]

/**
 * 한 수의 기록. `isPass`면 from/to/piece/captured 모두 null.
 * 사람이 읽는 표기는 game/janggi-notation.ts 에서만 만든다.
 */
export interface Move {
  readonly from: Position | null
  readonly to: Position | null
  readonly piece: Piece | null
  readonly captured: Piece | null
  readonly isPass: boolean
}

export interface GameConfig {
  /** 한(漢)의 마·상 배치. */
  readonly hanFormation: Formation
  /** 초(楚)의 마·상 배치. */
  readonly choFormation: Formation
  /** 빅장(양 궁 정면) 시 무승부 처리 여부. */
  readonly bikjangDraw: boolean
  /** 같은 국면이 이 횟수만큼 나타나면 무승부. */
  readonly repetitionLimit: number
}

export interface GameState {
  readonly board: Board
  /** 다음에 둘 차례. */
  readonly turn: Side
  readonly moveHistory: readonly Move[]
  /** 잡힌 기물들 (잡은 순서대로). */
  readonly capturedPieces: readonly Piece[]
  readonly config: GameConfig
}

export const ALL_SIDES: readonly Side[] = ['CHO', 'HAN']

export const ALL_FORMATIONS: readonly Formation[] = ['MSMS', 'SMSM', 'MSSM', 'SMMS']

export const FORMATION_LABEL: Record<Formation, string> = {
  MSMS: '마상마상',
  SMSM: '상마상마',
  MSSM: '마상상마',
  SMMS: '상마마상',
}

/** 기물 점수. 무승부 시 이 합계가 높은 쪽이 승리한다 (RULES.md 점수 항목). */
export const PIECE_VALUE: Record<PieceType, number> = {
  CHA: 13,
  PO: 7,
  MA: 5,
  SANG: 3,
  SA: 3,
  JOL: 2,
  GUNG: 0,
}

/** 후수(한, 漢)가 받는 덤. */
export const HAN_BONUS = 1.5

export const DEFAULT_CONFIG: GameConfig = {
  hanFormation: 'MSMS',
  choFormation: 'MSMS',
  bikjangDraw: true,
  repetitionLimit: 3,
}
