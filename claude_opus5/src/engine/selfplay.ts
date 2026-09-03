/**
 * 자기대국(self-play) 검증기.
 *
 * 규칙 엔진만으로 대국을 끝까지 돌리고, 매 수마다 「규칙상 절대 일어나면 안 되는 일」을
 * 사후 검사한다. 검사는 이동 생성기와 독립적으로 다시 계산해서, 생성기가 틀렸을 때
 * 검사도 같이 틀리는 일이 없게 한다.
 *
 * 이 파일도 순수 TS 다. 콘솔 스크립트와 Vitest 가 모두 이걸 쓴다.
 */
import {
  BOARD_SIZE,
  createInitialState,
  forwardDir,
  isInBoard,
  isInPalace,
  fromIndex,
  pieceAt,
  positionKey,
  samePos,
} from './board';
import { raysFrom } from './moves';
import { getGameResult, type GameResult } from './result';
import { canPass, generateLegalMoves, makeMove, pass, undoMove } from './rules';
import {
  DEFAULT_CONFIG,
  type Board,
  type GameConfig,
  type GameState,
  type HorseSetup,
  type Move,
  type Side,
} from './types';

/* ------------------------------------------------------------------ */
/* 결정적 난수                                                          */
/* ------------------------------------------------------------------ */

export type Rng = () => number;

/** mulberry32 — 씨앗만 같으면 언제나 같은 대국이 재현된다. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* 불변식 검사                                                          */
/* ------------------------------------------------------------------ */

export type ViolationKind =
  | 'GUNG_CAPTURED'
  | 'OFF_BOARD'
  | 'PALACE_ESCAPE'
  | 'PO_JUMPED_PO'
  | 'PO_CAPTURED_PO'
  | 'PO_BAD_SCREEN'
  | 'JOL_BACKWARD'
  | 'PIECE_COUNT'
  | 'UNDO_MISMATCH';

export interface Violation {
  readonly kind: ViolationKind;
  readonly detail: string;
  readonly ply: number;
}

function countPieces(board: Board): number {
  let n = 0;
  for (let i = 0; i < BOARD_SIZE; i++) if (board[i]) n++;
  return n;
}

/** 포의 경로를 다시 계산해 「포대 정확히 1개, 그 포대는 포가 아님」을 확인한다. */
function checkPoPath(before: Board, move: Move): ViolationKind | null {
  const ray = raysFrom(move.from).find((r) => r.some((p) => samePos(p, move.to)));
  if (ray === undefined) return 'PO_BAD_SCREEN'; // 포가 갈 수 없는 경로로 갔다

  let screens = 0;
  let jumpedPo = false;
  for (const p of ray) {
    if (samePos(p, move.to)) break;
    const occupant = pieceAt(before, p);
    if (occupant === null) continue;
    screens++;
    if (occupant.type === 'PO') jumpedPo = true;
  }
  if (jumpedPo) return 'PO_JUMPED_PO';
  if (screens !== 1) return 'PO_BAD_SCREEN';
  return null;
}

/** 한 수와 그 결과 국면을 검사한다. */
export function findViolations(before: GameState, move: Move, after: GameState): Violation[] {
  const out: Violation[] = [];
  const ply = before.moveHistory.length + 1;
  const add = (kind: ViolationKind, detail: string): void => {
    out.push({ kind, detail, ply });
  };

  if (move.isPass) return out;

  // 궁을 잡는 수는 합법수로 생성되면 안 된다.
  if (move.captured === 'GUNG') add('GUNG_CAPTURED', '궁을 잡는 수가 합법수로 생성되었다');

  // 보드 밖 좌표
  if (!isInBoard(move.from) || !isInBoard(move.to)) {
    add('OFF_BOARD', `${JSON.stringify(move.from)} -> ${JSON.stringify(move.to)}`);
  }

  // 궁/사는 자기 궁성을 벗어날 수 없다.
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = after.board[i];
    if (!sq) continue;
    if (sq.type !== 'GUNG' && sq.type !== 'SA') continue;
    const at = fromIndex(i);
    if (!isInPalace(at, sq.side)) {
      add('PALACE_ESCAPE', `${sq.side} ${sq.type} @ ${at.file},${at.rank}`);
    }
  }

  // 포 규칙
  if (move.piece === 'PO') {
    if (move.captured === 'PO') add('PO_CAPTURED_PO', '포가 포를 잡았다');
    const poIssue = checkPoPath(before.board, move);
    if (poIssue !== null) add(poIssue, `${move.from.file},${move.from.rank} -> ${move.to.file},${move.to.rank}`);
  }

  // 졸/병은 뒤로 갈 수 없다.
  if (move.piece === 'JOL') {
    const delta = move.to.rank - move.from.rank;
    if (delta !== 0 && delta !== forwardDir(move.side)) {
      add('JOL_BACKWARD', `rank ${move.from.rank} -> ${move.to.rank} (${move.side})`);
    }
  }

  // 기물 수는 잡을 때만 하나 준다.
  const expected = countPieces(before.board) - (move.captured === null ? 0 : 1);
  if (countPieces(after.board) !== expected) {
    add('PIECE_COUNT', `${countPieces(before.board)} -> ${countPieces(after.board)}`);
  }

  // undo 는 원래 상태와 완전히 일치해야 한다.
  const back = undoMove(after);
  if (
    positionKey(back) !== positionKey(before) ||
    back.moveHistory.length !== before.moveHistory.length ||
    back.capturedPieces.HAN.length !== before.capturedPieces.HAN.length ||
    back.capturedPieces.CHO.length !== before.capturedPieces.CHO.length
  ) {
    add('UNDO_MISMATCH', 'undo 후 상태가 원본과 다르다');
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* 랜덤 대국                                                            */
/* ------------------------------------------------------------------ */

export interface SelfPlayOptions {
  readonly config?: GameConfig;
  readonly setups?: Readonly<Record<Side, HorseSetup>>;
  /** 합법수가 있어도 한 수 쉴 확률. pass 경로를 함께 검증하기 위한 것. */
  readonly passProbability?: number;
  /** true 면 매 수마다 불변식을 검사한다(느리다). */
  readonly validate?: boolean;
}

export interface SelfPlayReport {
  readonly seed: number;
  readonly plies: number;
  readonly result: GameResult;
  readonly violations: readonly Violation[];
  readonly finalState: GameState;
}

const HORSE_SETUPS_ALL: readonly HorseSetup[] = ['MSMS', 'SMSM', 'MSSM', 'SMMS'];

export function playRandomGame(seed: number, options: SelfPlayOptions = {}): SelfPlayReport {
  const rng = makeRng(seed);
  const config = options.config ?? DEFAULT_CONFIG;
  const setups =
    options.setups ??
    ({
      HAN: HORSE_SETUPS_ALL[Math.floor(rng() * 4)]!,
      CHO: HORSE_SETUPS_ALL[Math.floor(rng() * 4)]!,
    } as const);

  const passProbability = options.passProbability ?? 0.01;
  const validate = options.validate ?? true;

  let state = createInitialState(setups.HAN, setups.CHO, config);
  const violations: Violation[] = [];

  for (;;) {
    const result = getGameResult(state);
    if (result.status !== 'PLAYING') {
      return { seed, plies: state.moveHistory.length, result, violations, finalState: state };
    }

    const moves = generateLegalMoves(state);
    const wantPass = moves.length === 0 || (rng() < passProbability && canPass(state));

    if (wantPass) {
      if (!canPass(state)) {
        // 장군인데 합법수가 없다면 이미 외통이어야 한다 — getGameResult 가 잡았어야 한다.
        throw new Error('한 수 쉴 수도, 둘 수도 없는 국면이 남았다');
      }
      state = pass(state);
      continue;
    }

    const move = moves[Math.floor(rng() * moves.length)]!;
    const next = makeMove(state, move);
    if (validate) violations.push(...findViolations(state, next.moveHistory.at(-1)!, next));
    state = next;
  }
}
