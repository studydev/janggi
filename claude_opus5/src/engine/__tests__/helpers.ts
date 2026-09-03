/** 테스트용 보드 조립 헬퍼. */
import { BOARD_SIZE, toIndex } from '../board';
import type { Board, PieceType, Position, Side, Square } from '../types';

export type Placement = [file: number, rank: number, type: PieceType, side: Side];

export function emptyBoard(): Board {
  return new Array<Square>(BOARD_SIZE).fill(null);
}

/** 빈 보드에 기물을 놓아 새 보드를 만든다. */
export function boardWith(...placements: Placement[]): Board {
  const board: Square[] = new Array<Square>(BOARD_SIZE).fill(null);
  for (const [file, rank, type, side] of placements) {
    board[toIndex({ file, rank })] = { type, side };
  }
  return board;
}

/** 위치 목록을 'file,rank' 문자열 집합으로 정규화해 비교하기 쉽게 만든다. */
export function keys(positions: readonly Position[]): string[] {
  return positions.map((p) => `${p.file},${p.rank}`).sort();
}

export function k(...pairs: [number, number][]): string[] {
  return pairs.map(([f, r]) => `${f},${r}`).sort();
}

export function at(file: number, rank: number): Position {
  return { file, rank };
}
