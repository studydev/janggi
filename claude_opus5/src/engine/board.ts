/**
 * 보드 표현, 좌표 변환, 궁성 기하, 초기 배치.
 * 근거 문서: RULES.md 「보드」, 「초기 배치」
 */
import {
  type Board,
  type GameConfig,
  type GameState,
  type HorseSetup,
  type Piece,
  type PieceType,
  type Position,
  type Side,
  type Square,
  DEFAULT_CONFIG,
} from './types';

export const FILES = 9;
export const RANKS = 10;
export const BOARD_SIZE = FILES * RANKS;

/* ------------------------------------------------------------------ */
/* 좌표                                                                */
/* ------------------------------------------------------------------ */

export function isInBoard(p: Position): boolean {
  return p.file >= 1 && p.file <= FILES && p.rank >= 1 && p.rank <= RANKS;
}

/** Position -> 0..89 인덱스. 범위 검사는 호출자 책임(isInBoard). */
export function toIndex(p: Position): number {
  return (p.rank - 1) * FILES + (p.file - 1);
}

/** 0..89 인덱스 -> Position. */
export function fromIndex(index: number): Position {
  return { file: (index % FILES) + 1, rank: Math.floor(index / FILES) + 1 };
}

export function pos(file: number, rank: number): Position {
  return { file, rank };
}

export function samePos(a: Position, b: Position): boolean {
  return a.file === b.file && a.rank === b.rank;
}

export function shift(p: Position, df: number, dr: number): Position {
  return { file: p.file + df, rank: p.rank + dr };
}

export function pieceAt(board: Board, p: Position): Square {
  if (!isInBoard(p)) return null;
  return board[toIndex(p)] ?? null;
}

export function isEmpty(board: Board, p: Position): boolean {
  return pieceAt(board, p) === null;
}

/** 새 보드를 반환한다(불변). */
export function setPiece(board: Board, p: Position, piece: Square): Board {
  const next = board.slice();
  next[toIndex(p)] = piece;
  return next;
}

/** 해당 진영의 모든 기물과 위치. */
export function findPieces(board: Board, side: Side): { piece: Piece; at: Position }[] {
  const out: { piece: Piece; at: Position }[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = board[i];
    if (sq && sq.side === side) out.push({ piece: sq, at: fromIndex(i) });
  }
  return out;
}

export function findGung(board: Board, side: Side): Position | null {
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = board[i];
    if (sq && sq.side === side && sq.type === 'GUNG') return fromIndex(i);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 궁성 기하                                                            */
/* ------------------------------------------------------------------ */

/** 궁성: file 4~6. 한 = rank 1~3(위), 초 = rank 8~10(아래). */
export const PALACE_FILES = { min: 4, max: 6 } as const;

export const PALACE_RANKS: Readonly<Record<Side, { min: number; max: number }>> = {
  HAN: { min: 1, max: 3 },
  CHO: { min: 8, max: 10 },
};

export const PALACE_CENTER: Readonly<Record<Side, Position>> = {
  HAN: { file: 5, rank: 2 },
  CHO: { file: 5, rank: 9 },
};

export const PALACE_CORNERS: Readonly<Record<Side, readonly Position[]>> = {
  HAN: [
    { file: 4, rank: 1 },
    { file: 6, rank: 1 },
    { file: 4, rank: 3 },
    { file: 6, rank: 3 },
  ],
  CHO: [
    { file: 4, rank: 8 },
    { file: 6, rank: 8 },
    { file: 4, rank: 10 },
    { file: 6, rank: 10 },
  ],
};

export function isInPalace(p: Position, side: Side): boolean {
  const r = PALACE_RANKS[side];
  return (
    p.file >= PALACE_FILES.min && p.file <= PALACE_FILES.max && p.rank >= r.min && p.rank <= r.max
  );
}

/** 어느 쪽 궁성에 속하는가. 궁성 밖이면 null. */
export function palaceOf(p: Position): Side | null {
  if (isInPalace(p, 'HAN')) return 'HAN';
  if (isInPalace(p, 'CHO')) return 'CHO';
  return null;
}

export function isInAnyPalace(p: Position): boolean {
  return palaceOf(p) !== null;
}

/**
 * 궁성 대각선 위의 지점인가.
 * 대각선은 네 귀퉁이와 중앙을 잇는 선이므로,
 * 대각선 위의 지점 = 귀퉁이 4곳 + 중앙 1곳.
 */
export function isOnPalaceDiagonal(p: Position): boolean {
  const side = palaceOf(p);
  if (side === null) return false;
  if (samePos(p, PALACE_CENTER[side])) return true;
  return PALACE_CORNERS[side].some((corner) => samePos(p, corner));
}

/** 특정 진영 궁성의 대각선 위인가. (졸/병의 「상대 궁성 대각 전진」 판정용) */
export function isOnPalaceDiagonalOf(p: Position, side: Side): boolean {
  return palaceOf(p) === side && isOnPalaceDiagonal(p);
}

/**
 * 대각선(그어진 선)으로 직접 연결된 이웃 지점들.
 * 중앙 -> 네 귀퉁이, 귀퉁이 -> 중앙. 귀퉁이끼리는 직접 연결되지 않는다.
 * RULES.md: 궁성 대각선은 궁성 밖으로 이어지지 않는다.
 */
export function palaceDiagonalNeighbors(p: Position): Position[] {
  const side = palaceOf(p);
  if (side === null) return [];
  const center = PALACE_CENTER[side];
  if (samePos(p, center)) return PALACE_CORNERS[side].map((c) => ({ ...c }));
  if (PALACE_CORNERS[side].some((c) => samePos(p, c))) return [{ ...center }];
  return [];
}

/**
 * p에서 (df, dr) 방향으로 궁성 대각선을 따라 한 걸음. 그어진 선이 없으면 null.
 * 귀퉁이 -> 중앙 -> 반대편 귀퉁이 로 이어지는 진행이 자연스럽게 나온다.
 */
export function nextOnPalaceDiagonal(p: Position, df: number, dr: number): Position | null {
  const target = shift(p, df, dr);
  const found = palaceDiagonalNeighbors(p).find((n) => samePos(n, target));
  return found ?? null;
}

/** 두 지점이 같은 궁성의 대각선 위인가. (공격 후보 사전 필터용) */
export function onSamePalaceDiagonal(a: Position, b: Position): boolean {
  const pa = palaceOf(a);
  return pa !== null && pa === palaceOf(b) && isOnPalaceDiagonal(a) && isOnPalaceDiagonal(b);
}

export const DIAGONAL_DIRS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

export const ORTHOGONAL_DIRS: readonly (readonly [number, number])[] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/* ------------------------------------------------------------------ */
/* 진행 방향                                                            */
/* ------------------------------------------------------------------ */

/**
 * 졸/병이 전진하는 rank 증분.
 * 한(漢)은 위쪽(rank 1~4)에 있으므로 rank가 커지는 방향(+1)이 전진,
 * 초(楚)는 아래쪽(rank 7~10)에 있으므로 rank가 작아지는 방향(-1)이 전진.
 */
export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1;
}

/* ------------------------------------------------------------------ */
/* 초기 배치                                                            */
/* ------------------------------------------------------------------ */

/** 배치 문자열('MSMS' 등)을 file 2,3,7,8 의 기물 종류로 푼다. */
function decodeHorseSetup(setup: HorseSetup): [PieceType, PieceType, PieceType, PieceType] {
  const map = (ch: string): PieceType => (ch === 'M' ? 'MA' : 'SANG');
  const chars = setup.split('');
  return [map(chars[0]!), map(chars[1]!), map(chars[2]!), map(chars[3]!)];
}

export const HORSE_SETUP_LABELS: Readonly<Record<HorseSetup, string>> = {
  MSMS: '마상마상',
  SMSM: '상마상마',
  MSSM: '마상상마',
  SMMS: '상마마상',
};

/**
 * RULES.md 「초기 배치」 그대로 보드를 만든다.
 * 한(漢): rank1 후열 / rank2 궁 / rank3 포 / rank4 병
 * 초(楚): 위 배치를 상하 대칭 (rank10 / rank9 / rank8 / rank7)
 */
export function createInitialBoard(hanSetup: HorseSetup, choSetup: HorseSetup): Board {
  const board: Square[] = new Array<Square>(BOARD_SIZE).fill(null);

  const put = (file: number, rank: number, type: PieceType, side: Side): void => {
    board[toIndex({ file, rank })] = { type, side };
  };

  const layout = (side: Side, setup: HorseSetup): void => {
    const backRank = side === 'HAN' ? 1 : 10;
    const gungRank = side === 'HAN' ? 2 : 9;
    const poRank = side === 'HAN' ? 3 : 8;
    const jolRank = side === 'HAN' ? 4 : 7;

    const [h2, h3, h7, h8] = decodeHorseSetup(setup);

    put(1, backRank, 'CHA', side);
    put(2, backRank, h2, side);
    put(3, backRank, h3, side);
    put(4, backRank, 'SA', side);
    // file 5 (후열)은 비어 있다 — 궁은 궁성 중앙에 놓인다.
    put(6, backRank, 'SA', side);
    put(7, backRank, h7, side);
    put(8, backRank, h8, side);
    put(9, backRank, 'CHA', side);

    put(5, gungRank, 'GUNG', side);

    put(2, poRank, 'PO', side);
    put(8, poRank, 'PO', side);

    for (const f of [1, 3, 5, 7, 9]) put(f, jolRank, 'JOL', side);
  };

  layout('HAN', hanSetup);
  layout('CHO', choSetup);
  return board;
}

/** 초기 GameState. RULES.md: 초(楚)가 선수. */
export function createInitialState(
  hanSetup: HorseSetup = 'MSMS',
  choSetup: HorseSetup = 'MSMS',
  config: GameConfig = DEFAULT_CONFIG,
): GameState {
  const board = createInitialBoard(hanSetup, choSetup);
  const base: GameState = {
    board,
    turn: 'CHO',
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config,
    positionKeys: [],
    setup: { HAN: hanSetup, CHO: choSetup },
  };
  return { ...base, positionKeys: [positionKey(base)] };
}

/* ------------------------------------------------------------------ */
/* 국면 키 (반복 판정용)                                                */
/* ------------------------------------------------------------------ */

const TYPE_CHAR: Readonly<Record<PieceType, string>> = {
  GUNG: 'G',
  SA: 'S',
  CHA: 'C',
  PO: 'P',
  MA: 'M',
  SANG: 'E',
  JOL: 'J',
};

/** 보드 + 차례를 문자열로 직렬화. 같은 국면이면 같은 문자열이 나온다. */
export function positionKey(state: Pick<GameState, 'board' | 'turn'>): string {
  let s = '';
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = state.board[i];
    if (!sq) {
      s += '.';
    } else {
      const c = TYPE_CHAR[sq.type];
      s += sq.side === 'HAN' ? c : c.toLowerCase();
    }
  }
  return s + '|' + state.turn;
}

/* ------------------------------------------------------------------ */
/* 표기와 디버그 출력                                                   */
/* ------------------------------------------------------------------ */

export const PIECE_HANJA: Readonly<Record<PieceType, Readonly<Record<Side, string>>>> = {
  GUNG: { HAN: '漢', CHO: '楚' },
  SA: { HAN: '士', CHO: '士' },
  CHA: { HAN: '車', CHO: '車' },
  PO: { HAN: '包', CHO: '包' },
  MA: { HAN: '馬', CHO: '馬' },
  SANG: { HAN: '象', CHO: '象' },
  JOL: { HAN: '兵', CHO: '卒' },
};

export const PIECE_HANGUL: Readonly<Record<PieceType, Readonly<Record<Side, string>>>> = {
  GUNG: { HAN: '한', CHO: '초' },
  SA: { HAN: '사', CHO: '사' },
  CHA: { HAN: '차', CHO: '차' },
  PO: { HAN: '포', CHO: '포' },
  MA: { HAN: '마', CHO: '마' },
  SANG: { HAN: '상', CHO: '상' },
  JOL: { HAN: '병', CHO: '졸' },
};

export const SIDE_LABEL: Readonly<Record<Side, string>> = { HAN: '한(漢)', CHO: '초(楚)' };

/** 콘솔용 텍스트 보드. 한 = [漢], 초 = (楚), 궁성 대각 교차점은 x. */
export function boardToText(board: Board): string {
  const lines: string[] = [];
  lines.push('     1  2  3  4  5  6  7  8  9');
  for (let rank = 1; rank <= RANKS; rank++) {
    const cells: string[] = [];
    for (let file = 1; file <= FILES; file++) {
      const at = { file, rank };
      const sq = pieceAt(board, at);
      if (!sq) {
        cells.push(isOnPalaceDiagonal(at) ? ' x ' : ' . ');
      } else {
        const ch = PIECE_HANJA[sq.type][sq.side];
        cells.push(sq.side === 'HAN' ? '[' + ch + ']' : '(' + ch + ')');
      }
    }
    lines.push(String(rank).padStart(2, ' ') + '  ' + cells.join(''));
  }
  lines.push('    한(漢)=[ ] 위쪽 / 초(楚)=( ) 아래쪽');
  return lines.join('\n');
}

export function debugPrint(state: GameState): void {
  const captured =
    '잡은 기물  초: ' +
    (state.capturedPieces.CHO.join(',') || '-') +
    '  한: ' +
    (state.capturedPieces.HAN.join(',') || '-');
  // eslint-disable-next-line no-console
  console.log(
    [
      boardToText(state.board),
      '차례: ' + SIDE_LABEL[state.turn] + '   수: ' + state.moveHistory.length,
      captured,
    ].join('\n'),
  );
}
