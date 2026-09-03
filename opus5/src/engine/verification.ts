import { forwardDir, isInBoard, isInPalace, isOnPalaceDiagonal, pieceAt, toPosition } from './board';
import { getGameResult } from './result';
import { createGame, generateLegalMoves, makeMove, pass, undoMove } from './rules';
import { DEFAULT_CONFIG } from './types';
import type { Board, GameConfig, GameState, MoveInput, Position, SetupCode } from './types';
import { SETUP_CODES } from './types';

export interface Violation {
  readonly game: number;
  readonly ply: number;
  readonly kind: string;
  readonly detail: string;
}

export interface RandomGameOptions {
  readonly games?: number;
  readonly maxPlies?: number;
  readonly seed?: number;
  readonly config?: Partial<GameConfig>;
  /** makeMove → undo 왕복이 원본과 같은지 검사할 최대 착수 수 (게임당) */
  readonly undoChecks?: number;
}

export interface RandomGameStats {
  readonly games: number;
  readonly totalPlies: number;
  readonly results: Record<string, number>;
  readonly violations: Violation[];
}

/** 재현 가능한 난수 (mulberry32). */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sign(n: number): number {
  return n === 0 ? 0 : n > 0 ? 1 : -1;
}

/** 두 지점 사이(양 끝 제외)의 기물 수와 포 포함 여부. 정렬되지 않은 경우 aligned=false. */
function scanBetween(
  board: Board,
  from: Position,
  to: Position,
): { aligned: boolean; count: number; screenIsPo: boolean } {
  const df = to.file - from.file;
  const dr = to.rank - from.rank;
  const diagonal = df !== 0 && dr !== 0;
  if (diagonal && Math.abs(df) !== Math.abs(dr)) return { aligned: false, count: 0, screenIsPo: false };
  if (diagonal && !(isOnPalaceDiagonal(from) && isOnPalaceDiagonal(to))) {
    return { aligned: false, count: 0, screenIsPo: false };
  }

  const step = { file: sign(df), rank: sign(dr) };
  let count = 0;
  let screenIsPo = false;
  let cur = { file: from.file + step.file, rank: from.rank + step.rank };
  while (cur.file !== to.file || cur.rank !== to.rank) {
    const occupant = pieceAt(board, cur);
    if (occupant) {
      count += 1;
      if (occupant.type === 'PO') screenIsPo = true;
    }
    cur = { file: cur.file + step.file, rank: cur.rank + step.rank };
  }
  return { aligned: true, count, screenIsPo };
}

/** 이동 생성기와 별개로, 착수 결과가 규칙을 어기지 않았는지 독립적으로 다시 확인한다. */
export function inspectMove(state: GameState, move: MoveInput): string[] {
  const problems: string[] = [];
  const piece = pieceAt(state.board, move.from);
  if (!piece) return ['출발 지점에 기물이 없다'];
  if (!isInBoard(move.to)) problems.push('보드 밖으로 이동');

  const target = pieceAt(state.board, move.to);
  if (target?.type === 'GUNG') problems.push('궁을 잡는 수가 합법수로 생성됨');
  if (target && target.side === piece.side) problems.push('아군 기물을 잡는 수');

  if (piece.type === 'PO') {
    const scan = scanBetween(state.board, move.from, move.to);
    if (!scan.aligned) problems.push('포가 직선/궁성 대각선이 아닌 경로로 이동');
    else if (scan.count !== 1) problems.push(`포대가 ${scan.count}개인데 이동함`);
    else if (scan.screenIsPo) problems.push('포가 포를 넘음');
    if (target?.type === 'PO') problems.push('포가 포를 잡음');
  }

  if (piece.type === 'JOL') {
    const dr = move.to.rank - move.from.rank;
    const df = move.to.file - move.from.file;
    if (dr === -forwardDir(piece.side)) problems.push('졸/병이 뒤로 이동');
    if (Math.abs(dr) > 1 || Math.abs(df) > 1) problems.push('졸/병이 2칸 이상 이동');
  }

  if ((piece.type === 'GUNG' || piece.type === 'SA') && !isInPalace(move.to, piece.side)) {
    problems.push('궁/사가 궁성을 벗어남');
  }

  return problems;
}

function inspectBoard(board: Board): string[] {
  const problems: string[] = [];
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (!piece) continue;
    const pos = toPosition(i);
    if (!isInBoard(pos)) problems.push('보드 밖에 기물이 존재');
    if ((piece.type === 'GUNG' || piece.type === 'SA') && !isInPalace(pos, piece.side)) {
      problems.push(`${piece.side} ${piece.type}가 궁성 밖에 있음`);
    }
  }
  return problems;
}

/**
 * 랜덤 대국을 반복 실행하며 규칙 위반을 찾는다.
 * 위반이 하나라도 나오면 엔진이 잘못된 것이다.
 */
export function runRandomGames(options: RandomGameOptions = {}): RandomGameStats {
  const games = options.games ?? 100;
  const maxPlies = options.maxPlies ?? 300;
  const undoChecks = options.undoChecks ?? 4;
  const random = createRandom(options.seed ?? 20260903);
  const config: GameConfig = { ...DEFAULT_CONFIG, ...options.config };

  const violations: Violation[] = [];
  const results: Record<string, number> = {};
  let totalPlies = 0;

  for (let game = 0; game < games; game += 1) {
    const pick = (): SetupCode => SETUP_CODES[Math.floor(random() * SETUP_CODES.length)];
    let state = createGame({ hanSetup: pick(), choSetup: pick(), config });
    let ply = 0;
    let status = 'MAX_PLIES';

    while (ply < maxPlies) {
      const result = getGameResult(state);
      if (result.status !== 'PLAYING') {
        status = result.status;
        break;
      }

      const moves = generateLegalMoves(state);
      if (moves.length === 0) {
        state = pass(state); // 장군이 아닌데 둘 수 없으면 한 수 쉰다
        ply += 1;
        continue;
      }

      const move = moves[Math.floor(random() * moves.length)];
      for (const candidate of moves) {
        for (const problem of inspectMove(state, candidate)) {
          violations.push({ game, ply, kind: 'MOVE', detail: problem });
        }
      }

      const before = state;
      state = makeMove(state, move);
      if (ply < undoChecks) {
        const restored = undoMove(state);
        if (JSON.stringify(restored) !== JSON.stringify(before)) {
          violations.push({ game, ply, kind: 'UNDO', detail: 'undo 결과가 착수 직전 상태와 다르다' });
        }
      }
      for (const problem of inspectBoard(state.board)) {
        violations.push({ game, ply, kind: 'BOARD', detail: problem });
      }
      ply += 1;
    }

    results[status] = (results[status] ?? 0) + 1;
    totalPlies += ply;
  }

  return { games, totalPlies, results, violations };
}
