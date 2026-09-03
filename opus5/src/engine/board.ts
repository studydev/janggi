import type { Board, GameState, Piece, PieceType, Position, SetupCode, Side, Square } from './types';

export const FILE_COUNT = 9;
export const RANK_COUNT = 10;
export const BOARD_SIZE = FILE_COUNT * RANK_COUNT;

export function toIndex(pos: Position): number {
  return (pos.rank - 1) * FILE_COUNT + (pos.file - 1);
}

export function toPosition(index: number): Position {
  return { file: (index % FILE_COUNT) + 1, rank: Math.floor(index / FILE_COUNT) + 1 };
}

export function isInBoard(pos: Position): boolean {
  return pos.file >= 1 && pos.file <= FILE_COUNT && pos.rank >= 1 && pos.rank <= RANK_COUNT;
}

export function samePosition(a: Position, b: Position): boolean {
  return a.file === b.file && a.rank === b.rank;
}

export function pieceAt(board: Board, pos: Position): Square {
  if (!isInBoard(pos)) return null;
  return board[toIndex(pos)] ?? null;
}

export function opponent(side: Side): Side {
  return side === 'HAN' ? 'CHO' : 'HAN';
}

/** 한(漢)은 위쪽이므로 rank가 커지는 방향, 초(楚)는 아래쪽이므로 rank가 작아지는 방향이 전진이다. */
export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1;
}

export function isInPalace(pos: Position, side: Side): boolean {
  if (pos.file < 4 || pos.file > 6) return false;
  return side === 'HAN' ? pos.rank >= 1 && pos.rank <= 3 : pos.rank >= 8 && pos.rank <= 10;
}

export function palaceSideOf(pos: Position): Side | null {
  if (isInPalace(pos, 'HAN')) return 'HAN';
  if (isInPalace(pos, 'CHO')) return 'CHO';
  return null;
}

/** 궁성 대각선 위의 교차점: 네 귀퉁이와 중앙. */
export const PALACE_DIAGONAL_POINTS: readonly Position[] = [
  { file: 4, rank: 1 },
  { file: 6, rank: 1 },
  { file: 5, rank: 2 },
  { file: 4, rank: 3 },
  { file: 6, rank: 3 },
  { file: 4, rank: 8 },
  { file: 6, rank: 8 },
  { file: 5, rank: 9 },
  { file: 4, rank: 10 },
  { file: 6, rank: 10 },
];

const PALACE_DIAGONAL_INDICES = new Set(PALACE_DIAGONAL_POINTS.map(toIndex));

export function isOnPalaceDiagonal(pos: Position): boolean {
  return isInBoard(pos) && PALACE_DIAGONAL_INDICES.has(toIndex(pos));
}

export const PALACE_CENTERS: readonly Position[] = [
  { file: 5, rank: 2 },
  { file: 5, rank: 9 },
];

export function isPalaceCenter(pos: Position): boolean {
  return pos.file === 5 && (pos.rank === 2 || pos.rank === 9);
}

function place(board: Square[], file: number, rank: number, side: Side, type: PieceType): void {
  board[toIndex({ file, rank })] = { side, type };
}

/** 마·상 배치 코드를 file 2, 3, 7, 8 순서로 해석한다. */
function setupTypes(code: SetupCode): PieceType[] {
  return code.split('').map((ch) => (ch === 'M' ? 'MA' : 'SANG'));
}

export function createInitialBoard(hanSetup: SetupCode, choSetup: SetupCode): Board {
  const board: Square[] = new Array<Square>(BOARD_SIZE).fill(null);
  const minorFiles = [2, 3, 7, 8];

  // 한(漢): 위쪽 rank 1~4
  place(board, 1, 1, 'HAN', 'CHA');
  place(board, 9, 1, 'HAN', 'CHA');
  place(board, 4, 1, 'HAN', 'SA');
  place(board, 6, 1, 'HAN', 'SA');
  place(board, 5, 2, 'HAN', 'GUNG');
  place(board, 2, 3, 'HAN', 'PO');
  place(board, 8, 3, 'HAN', 'PO');
  for (const file of [1, 3, 5, 7, 9]) place(board, file, 4, 'HAN', 'JOL');
  setupTypes(hanSetup).forEach((type, i) => place(board, minorFiles[i], 1, 'HAN', type));

  // 초(楚): 한의 배치를 상하 대칭 (file 유지, rank 반전)
  place(board, 1, 10, 'CHO', 'CHA');
  place(board, 9, 10, 'CHO', 'CHA');
  place(board, 4, 10, 'CHO', 'SA');
  place(board, 6, 10, 'CHO', 'SA');
  place(board, 5, 9, 'CHO', 'GUNG');
  place(board, 2, 8, 'CHO', 'PO');
  place(board, 8, 8, 'CHO', 'PO');
  for (const file of [1, 3, 5, 7, 9]) place(board, file, 7, 'CHO', 'JOL');
  setupTypes(choSetup).forEach((type, i) => place(board, minorFiles[i], 10, 'CHO', type));

  return board;
}

export function findGung(board: Board, side: Side): Position | null {
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (piece && piece.side === side && piece.type === 'GUNG') return toPosition(i);
  }
  return null;
}

export function piecesOf(board: Board, side: Side): { pos: Position; piece: Piece }[] {
  const result: { pos: Position; piece: Piece }[] = [];
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (piece && piece.side === side) result.push({ pos: toPosition(i), piece });
  }
  return result;
}

const DEBUG_LETTERS: Record<PieceType, string> = {
  CHA: 'R',
  PO: 'C',
  MA: 'H',
  SANG: 'E',
  SA: 'A',
  JOL: 'P',
  GUNG: 'K',
};

/** 국면 반복 감지용 키. 보드 배치 + 차례. */
export function boardKey(board: Board, turn: Side): string {
  let key = turn === 'HAN' ? 'H|' : 'C|';
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (!piece) {
      key += '.';
    } else {
      const letter = DEBUG_LETTERS[piece.type];
      key += piece.side === 'HAN' ? letter : letter.toLowerCase();
    }
  }
  return key;
}

/** 콘솔 확인용 텍스트 보드. 한(漢)은 대문자, 초(楚)는 소문자. */
export function renderBoard(board: Board): string {
  const lines: string[] = [];
  lines.push('    ' + Array.from({ length: FILE_COUNT }, (_, i) => String(i + 1)).join(' '));
  for (let rank = 1; rank <= RANK_COUNT; rank += 1) {
    let row = String(rank).padStart(2, ' ') + '  ';
    const cells: string[] = [];
    for (let file = 1; file <= FILE_COUNT; file += 1) {
      const piece = pieceAt(board, { file, rank });
      if (!piece) {
        cells.push(isOnPalaceDiagonal({ file, rank }) ? '+' : '.');
      } else {
        const letter = DEBUG_LETTERS[piece.type];
        cells.push(piece.side === 'HAN' ? letter : letter.toLowerCase());
      }
    }
    row += cells.join(' ');
    lines.push(row);
  }
  lines.push('  R:차 C:포 H:마 E:상 A:사 P:졸/병 K:궁  (대문자=한, 소문자=초)');
  return lines.join('\n');
}

export function debugPrint(state: GameState): string {
  const text = [
    renderBoard(state.board),
    `turn: ${state.turn}  moves: ${state.moveHistory.length}`,
  ].join('\n');
  // eslint-disable-next-line no-console
  console.log(text);
  return text;
}
