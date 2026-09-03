// 장기 엔진의 핵심 타입 정의. 이 파일은 순수 타입/상수만 포함하며 로직을 갖지 않는다.

/** 한(漢, 위쪽 진영) / 초(楚, 아래쪽 진영·선수) */
export type Side = 'HAN' | 'CHO'

/** 궁(장), 사, 차, 포, 마, 상, 졸/병 */
export type PieceType = 'GUNG' | 'SA' | 'CHA' | 'PO' | 'MA' | 'SANG' | 'JOL'

export interface Piece {
  readonly type: PieceType
  readonly side: Side
}

/** file: 1~9 (왼쪽→오른쪽), rank: 1~10 (위→아래). 기물은 칸이 아니라 선의 교차점에 위치한다. */
export interface Position {
  readonly file: number
  readonly rank: number
}

/** 9x10 = 90개 교차점을 담는 1차원 배열. 인덱스 변환은 board.ts의 toIndex/toPosition 참고. */
export type Board = readonly (Piece | null)[]

/**
 * 마상 배치 조합. 좌측(2,3열)과 우측(7,8열) 각각의 마/상 순서를 나타낸다.
 * MSMS=마상마상, SMSM=상마상마, MSSM=마상상마, SMMS=상마마상
 */
export type JinSetup = 'MSMS' | 'SMSM' | 'MSSM' | 'SMMS'

export interface Move {
  readonly from: Position
  readonly to: Position
  readonly piece: Piece
  readonly captured: Piece | null
  readonly isPass: boolean
}

export interface GameConfig {
  /** 빅장(면장) 발생 시 비김으로 처리할지 여부. 기본 true. */
  readonly bikjangIsDraw: boolean
  /** 동일 국면(보드+차례)이 이 횟수만큼 반복되면 비김. 기본 4. */
  readonly repetitionLimit: number
}

export const DEFAULT_CONFIG: GameConfig = {
  bikjangIsDraw: true,
  repetitionLimit: 4,
}

/**
 * capturedPieces.HAN = "한 소속이었다가 잡힌 기물들"(즉 초가 잡아낸 전리품),
 * capturedPieces.CHO = "초 소속이었다가 잡힌 기물들"(즉 한이 잡아낸 전리품).
 */
export interface CapturedPieces {
  readonly HAN: readonly Piece[]
  readonly CHO: readonly Piece[]
}

export interface GameState {
  readonly board: Board
  readonly turn: Side
  readonly moveHistory: readonly Move[]
  readonly capturedPieces: CapturedPieces
  readonly config: GameConfig
  /** 국면 반복 감지를 위한 누적 카운트. 키는 board.ts의 positionKey()로 생성. */
  readonly positionCounts: Readonly<Record<string, number>>
}
