import { boardKey, findGung, opponent, pieceAt } from './board';
import { generateLegalMoves, isCheck } from './rules';
import { PIECE_VALUES } from './types';
import type { GameState, Side } from './types';

export type GameStatus =
  | 'PLAYING'
  | 'CHECKMATE'
  | 'RESIGN'
  | 'DRAW_AGREED'
  | 'DRAW_BY_SCORE';

export interface GameResult {
  readonly status: GameStatus;
  readonly winner: Side | null;
  readonly reason: string;
}

export const SIDE_LABEL: Readonly<Record<Side, string>> = { HAN: '한(漢)', CHO: '초(楚)' };

/**
 * 외통: 장군을 받은 상태에서 합법수가 하나도 없는 경우.
 * 한 수 쉬기가 있으므로 장군이 아닌데 둘 수가 없는 상황(스테일메이트)은 패배가 아니다.
 */
export function isCheckmate(state: GameState, side: Side): boolean {
  if (!isCheck(state, side)) return false;
  return generateLegalMoves(state, side).length === 0;
}

/** 빅장: 양 궁이 같은 file에서 사이에 기물 없이 마주보는 상태. */
export function isBikjang(state: GameState): boolean {
  const hanGung = findGung(state.board, 'HAN');
  const choGung = findGung(state.board, 'CHO');
  if (!hanGung || !choGung) return false;
  if (hanGung.file !== choGung.file) return false;

  const from = Math.min(hanGung.rank, choGung.rank) + 1;
  const to = Math.max(hanGung.rank, choGung.rank) - 1;
  for (let rank = from; rank <= to; rank += 1) {
    if (pieceAt(state.board, { file: hanGung.file, rank })) return false;
  }
  return true;
}

/** 현재 국면이 몇 번째로 반복되고 있는지. */
export function repetitionCount(state: GameState): number {
  return state.positionCounts[boardKey(state.board, state.turn)] ?? 0;
}

export function isRepetitionDraw(state: GameState): boolean {
  return repetitionCount(state) >= state.config.repetitionLimit;
}

/** 기물 점수 합계. 한(漢)은 후수 보상(덤)을 더한다. */
export function calculateScore(state: GameState, side: Side): number {
  let score = 0;
  for (const piece of state.board) {
    if (piece && piece.side === side) score += PIECE_VALUES[piece.type];
  }
  if (side === 'HAN') score += state.config.hanBonus;
  return score;
}

/** 무승부 조건이 성립했을 때는 점수가 높은 쪽이 이긴다. */
function resolveByScore(state: GameState, reason: string): GameResult {
  const han = calculateScore(state, 'HAN');
  const cho = calculateScore(state, 'CHO');
  const winner = han === cho ? null : han > cho ? 'HAN' : 'CHO';
  return {
    status: 'DRAW_BY_SCORE',
    winner,
    reason: `${reason} (한 ${han}점 : 초 ${cho}점)`,
  };
}

export function getGameResult(state: GameState): GameResult {
  const side = state.turn;
  if (isCheckmate(state, side)) {
    return {
      status: 'CHECKMATE',
      winner: opponent(side),
      reason: `${SIDE_LABEL[side]} 외통`,
    };
  }
  if (state.config.bikjangDraw && isBikjang(state)) {
    return resolveByScore(state, '빅장');
  }
  if (isRepetitionDraw(state)) {
    return resolveByScore(state, `같은 국면 ${state.config.repetitionLimit}회 반복`);
  }
  return { status: 'PLAYING', winner: null, reason: '' };
}

export function isGameOver(state: GameState): boolean {
  return getGameResult(state).status !== 'PLAYING';
}
