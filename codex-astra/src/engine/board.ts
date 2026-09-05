import type { Board, GameState, Piece, PieceType, Position, Setup, Side } from './types';

export const SETUPS: readonly Setup[] = ['MASANGMASANG', 'SANGMASANGMA', 'MASANGSANGMA', 'SANGMAMASANG'];
const FORMATIONS: Record<Setup, readonly PieceType[]> = {
  MASANGMASANG: ['MA', 'SANG', 'MA', 'SANG'],
  SANGMASANGMA: ['SANG', 'MA', 'SANG', 'MA'],
  MASANGSANGMA: ['MA', 'SANG', 'SANG', 'MA'],
  SANGMAMASANG: ['SANG', 'MA', 'MA', 'SANG'],
};

export function isInBoard(pos: Position): boolean {
  return Number.isInteger(pos.file) && Number.isInteger(pos.rank)
    && pos.file >= 1 && pos.file <= 9 && pos.rank >= 1 && pos.rank <= 10;
}
export function toIndex(pos: Position): number {
  if (!isInBoard(pos)) throw new Error('장기판 밖의 좌표입니다.');
  return (pos.rank - 1) * 9 + pos.file - 1;
}
export function fromIndex(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= 90) throw new Error('잘못된 장기판 인덱스입니다.');
  return { file: index % 9 + 1, rank: Math.floor(index / 9) + 1 };
}
export function pieceAt(board: Board, pos: Position): Piece | null {
  return isInBoard(pos) ? board[(pos.rank - 1) * 9 + pos.file - 1] ?? null : null;
}
export function otherSide(side: Side): Side { return side === 'HAN' ? 'CHO' : 'HAN'; }
export function forwardDir(side: Side): 1 | -1 { return side === 'HAN' ? 1 : -1; }
export function isInPalace(pos: Position, side: Side): boolean {
  const minRank = side === 'HAN' ? 1 : 8;
  return isInBoard(pos) && pos.file >= 4 && pos.file <= 6 && pos.rank >= minRank && pos.rank <= minRank + 2;
}
export function isOnPalaceDiagonal(pos: Position): boolean {
  if (!isInPalace(pos, 'HAN') && !isInPalace(pos, 'CHO')) return false;
  const centerRank = pos.rank <= 3 ? 2 : 9;
  return Math.abs(pos.file - 5) === Math.abs(pos.rank - centerRank);
}

/** Palace lines are finite three-point paths, never continuations across the board. */
export function palaceRays(pos: Position): Position[][] {
  if (!isOnPalaceDiagonal(pos)) return [];
  const rank = pos.rank <= 3 ? 2 : 9;
  const lines = [
    [{ file: 4, rank: rank - 1 }, { file: 5, rank }, { file: 6, rank: rank + 1 }],
    [{ file: 6, rank: rank - 1 }, { file: 5, rank }, { file: 4, rank: rank + 1 }],
  ];
  const rays: Position[][] = [];
  for (const line of lines) {
    const index = line.findIndex(point => point.file === pos.file && point.rank === pos.rank);
    if (index < 0) continue;
    if (index > 0) rays.push(line.slice(0, index).reverse());
    if (index < 2) rays.push(line.slice(index + 1));
  }
  return rays;
}

export function createInitialBoard(hanSetup: Setup = 'MASANGMASANG', choSetup: Setup = 'MASANGMASANG'): Board {
  if (!SETUPS.includes(hanSetup) || !SETUPS.includes(choSetup)) throw new Error('지원하지 않는 마상 배치입니다.');
  const board: (Piece | null)[] = Array.from({ length: 90 }, () => null);
  for (const side of ['HAN', 'CHO'] as const) {
    const counts: Partial<Record<PieceType, number>> = {};
    const put = (type: PieceType, file: number, topRank: number) => {
      const rank = side === 'HAN' ? topRank : 11 - topRank;
      counts[type] = (counts[type] ?? 0) + 1;
      board[toIndex({ file, rank })] = { side, type, id: `${side}-${type}-${counts[type]}` };
    };
    put('CHA', 1, 1); put('CHA', 9, 1);
    const formation = FORMATIONS[side === 'HAN' ? hanSetup : choSetup];
    [2, 3, 7, 8].forEach((file, index) => put(formation[index]!, file, 1));
    put('SA', 4, 1); put('SA', 6, 1);
    put('GUNG', 5, 2);
    put('PO', 2, 3); put('PO', 8, 3);
    for (const file of [1, 3, 5, 7, 9]) put('JOL', file, 4);
  }
  return board;
}

export function positionKey(board: Board, turn: Side): string {
  return `${turn}|${board.map(piece => piece ? `${piece.side[0]}${piece.type}` : '.').join(',')}`;
}

export function debugPrint(state: Pick<GameState, 'board' | 'turn'>): string {
  const marks: Record<PieceType, string> = { GUNG: '궁', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸' };
  const rows = ['     1   2   3   4   5   6   7   8   9'];
  for (let rank = 1; rank <= 10; rank++) {
    const cells = Array.from({ length: 9 }, (_, i) => {
      const piece = pieceAt(state.board, { file: i + 1, rank });
      return piece ? `${piece.side === 'HAN' ? '한' : '초'}${marks[piece.type]}` : ' · ';
    });
    rows.push(`${String(rank).padStart(2)}  ${cells.join(' ')}`);
  }
  rows.push(`${state.turn === 'HAN' ? '한' : '초'} 차례`);
  return rows.join('\n');
}
