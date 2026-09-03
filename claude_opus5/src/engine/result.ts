/**
 * 승패·무승부 판정과 점수 계산.
 * 근거 문서: RULES.md 「대국 진행」, 「점수」
 */
import { BOARD_SIZE, findGung, isInBoard, pieceAt, positionKey } from './board';
import { generateLegalMoves, isCheck, isCheckOnBoard } from './rules';
import { opponent, PIECE_VALUES, type GameState, type Position, type Side } from './types';

export type GameStatus = 'PLAYING' | 'CHECKMATE' | 'DRAW_BY_SCORE' | 'RESIGNATION';

export type ResultReason =
  | 'NONE'
  | 'CHECKMATE'
  | 'BIKJANG'
  | 'REPETITION'
  | 'MOVE_LIMIT'
  | 'RESIGNATION'
  | 'AGREEMENT';

export interface GameResult {
  readonly status: GameStatus;
  readonly winner: Side | null;
  readonly reason: ResultReason;
  /** 사람이 읽는 사유. */
  readonly label: string;
  readonly scores: Readonly<Record<Side, number>>;
}

/* ------------------------------------------------------------------ */
/* 외통                                                                */
/* ------------------------------------------------------------------ */

/**
 * RULES.md: 「장군을 받으면 반드시 멍군해야 한다. 해소 불가 = 외통 = 패배.」
 *
 * 한 수 쉬기가 있으므로 「둘 수가 없어서 지는」 스테일메이트는 존재하지 않는다.
 * 장군이 아닌데 합법수가 없으면 그냥 한 수 쉰다(mustPass).
 */
export function isCheckmate(state: GameState, side: Side = state.turn): boolean {
  if (!isCheckOnBoard(state.board, side)) return false;
  return generateLegalMoves(state, side).length === 0;
}

/** 장군이 아닌데 둘 수 있는 수가 없는 상태 — 반드시 한 수 쉬어야 한다. */
export function mustPass(state: GameState): boolean {
  if (isCheck(state, state.turn)) return false;
  return generateLegalMoves(state, state.turn).length === 0;
}

/* ------------------------------------------------------------------ */
/* 빅장                                                                */
/* ------------------------------------------------------------------ */

/**
 * 빅장: 양 궁이 같은 세로줄에서 사이에 기물 없이 마주보는 상태.
 * RULES.md: 「기본은 비김. 설정으로 on/off.」
 * (양 궁성은 file 4~6 에만 있으므로 가로줄 대면은 발생할 수 없다.)
 */
export function isBikjang(state: GameState): boolean {
  const han = findGung(state.board, 'HAN');
  const cho = findGung(state.board, 'CHO');
  if (han === null || cho === null) return false;
  if (han.file !== cho.file) return false;

  const lo = Math.min(han.rank, cho.rank) + 1;
  const hi = Math.max(han.rank, cho.rank) - 1;
  for (let rank = lo; rank <= hi; rank++) {
    const p: Position = { file: han.file, rank };
    if (isInBoard(p) && pieceAt(state.board, p) !== null) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* 국면 반복                                                            */
/* ------------------------------------------------------------------ */

/** 현재 국면(보드 + 차례)이 지금까지 몇 번 나타났는가. */
export function repetitionCount(state: GameState): number {
  const key = positionKey({ board: state.board, turn: state.turn });
  let count = 0;
  for (const k of state.positionKeys) if (k === key) count++;
  return count;
}

export function isRepetitionDraw(state: GameState): boolean {
  return repetitionCount(state) >= state.config.repetitionLimit;
}

/* ------------------------------------------------------------------ */
/* 점수                                                                */
/* ------------------------------------------------------------------ */

/**
 * RULES.md 「점수」 — 차13 포7 마5 상3 사3 졸2 궁0, 한(漢)은 덤 +1.5.
 * 초기 총점은 각 72점(한은 덤 포함 73.5).
 */
export function calculateScore(state: GameState, side: Side): number {
  let total = side === 'HAN' ? state.config.hanBonus : 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    const sq = state.board[i];
    if (sq && sq.side === side) total += PIECE_VALUES[sq.type];
  }
  return total;
}

export function calculateScores(state: GameState): Record<Side, number> {
  return { HAN: calculateScore(state, 'HAN'), CHO: calculateScore(state, 'CHO') };
}

/** 점수가 높은 쪽. 완전히 같으면 null. */
function scoreWinner(scores: Record<Side, number>): Side | null {
  if (scores.HAN > scores.CHO) return 'HAN';
  if (scores.CHO > scores.HAN) return 'CHO';
  return null;
}

/* ------------------------------------------------------------------ */
/* 종합 판정                                                            */
/* ------------------------------------------------------------------ */

const SIDE_NAME: Record<Side, string> = { HAN: '한(漢)', CHO: '초(楚)' };

export function getGameResult(state: GameState): GameResult {
  const scores = calculateScores(state);

  // 방어적 처리: 궁이 사라진 국면은 곧바로 패배로 본다.
  for (const side of ['HAN', 'CHO'] as const) {
    if (findGung(state.board, side) === null) {
      return {
        status: 'CHECKMATE',
        winner: opponent(side),
        reason: 'CHECKMATE',
        label: `${SIDE_NAME[side]}의 궁이 잡혔습니다`,
        scores,
      };
    }
  }

  if (isCheckmate(state, state.turn)) {
    return {
      status: 'CHECKMATE',
      winner: opponent(state.turn),
      reason: 'CHECKMATE',
      label: `외통 — ${SIDE_NAME[state.turn]} 패배`,
      scores,
    };
  }

  // RULES.md: 「무승부 조건 발생 시 점수가 높은 쪽이 승리한다.」
  if (state.config.bikjangEnabled && isBikjang(state)) {
    return {
      status: 'DRAW_BY_SCORE',
      winner: scoreWinner(scores),
      reason: 'BIKJANG',
      label: '빅장 — 점수로 승부를 가립니다',
      scores,
    };
  }

  if (isRepetitionDraw(state)) {
    return {
      status: 'DRAW_BY_SCORE',
      winner: scoreWinner(scores),
      reason: 'REPETITION',
      label: `같은 국면 ${state.config.repetitionLimit}회 반복 — 점수로 승부를 가립니다`,
      scores,
    };
  }

  if (state.moveHistory.length >= state.config.maxPlies) {
    return {
      status: 'DRAW_BY_SCORE',
      winner: scoreWinner(scores),
      reason: 'MOVE_LIMIT',
      label: `${state.config.maxPlies}수 초과 — 점수로 승부를 가립니다`,
      scores,
    };
  }

  return { status: 'PLAYING', winner: null, reason: 'NONE', label: '대국 중', scores };
}

/** 기권은 상태에서 유도할 수 없으므로 UI 가 이 헬퍼로 결과를 만든다. */
export function resignationResult(state: GameState, resigning: Side): GameResult {
  return {
    status: 'RESIGNATION',
    winner: opponent(resigning),
    reason: 'RESIGNATION',
    label: `${SIDE_NAME[resigning]} 기권`,
    scores: calculateScores(state),
  };
}

/** 합의 무승부도 RULES.md 에 따라 점수로 승부를 가린다. */
export function agreementResult(state: GameState): GameResult {
  const scores = calculateScores(state);
  return {
    status: 'DRAW_BY_SCORE',
    winner: scoreWinner(scores),
    reason: 'AGREEMENT',
    label: '무승부 합의 — 점수로 승부를 가립니다',
    scores,
  };
}

export function isGameOver(result: GameResult): boolean {
  return result.status !== 'PLAYING';
}
