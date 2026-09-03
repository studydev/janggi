import { BOARD_SIZE, boardKey, toIndex } from '../board';
import { DEFAULT_CONFIG } from '../types';
import type { Board, GameConfig, GameState, PieceType, Position, Side, Square } from '../types';

export interface PieceSpec {
  side: Side;
  type: PieceType;
  file: number;
  rank: number;
}

export function at(file: number, rank: number): Position {
  return { file, rank };
}

export function buildBoard(specs: readonly PieceSpec[]): Board {
  const board: Square[] = new Array<Square>(BOARD_SIZE).fill(null);
  for (const spec of specs) {
    board[toIndex({ file: spec.file, rank: spec.rank })] = { side: spec.side, type: spec.type };
  }
  return board;
}

export function buildState(
  specs: readonly PieceSpec[],
  turn: Side = 'CHO',
  config: Partial<GameConfig> = {},
): GameState {
  const board = buildBoard(specs);
  const merged: GameConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    board,
    turn,
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config: merged,
    positionCounts: { [boardKey(board, turn)]: 1 },
    setup: { HAN: 'MSMS', CHO: 'MSMS' },
  };
}

/** 위치 목록을 "file,rank" 문자열 집합으로 정규화해 순서에 무관하게 비교한다. */
export function normalize(positions: readonly Position[]): string[] {
  return positions.map((p) => `${p.file},${p.rank}`).sort();
}

export function expectPositions(actual: readonly Position[], expected: readonly Position[]): void {
  const a = normalize(actual);
  const b = normalize(expected);
  if (a.join(' ') !== b.join(' ')) {
    throw new Error(`이동 지점 불일치\n  실제: ${a.join(' ')}\n  기대: ${b.join(' ')}`);
  }
}

export function includesPosition(positions: readonly Position[], pos: Position): boolean {
  return positions.some((p) => p.file === pos.file && p.rank === pos.rank);
}
