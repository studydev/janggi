import { fromIndex, otherSide, pieceAt, positionKey } from './board';
import { generateLegalMoves, isCheck } from './rules';
import type { GameResult, GameState, PieceType, Side } from './types';

export const PIECE_VALUES: Readonly<Record<PieceType, number>> = {
  CHA: 13, PO: 7, MA: 5, SANG: 3, SA: 3, JOL: 2, GUNG: 0,
};

export function calculateScore(state: Pick<GameState, 'board'>, side: Side): number {
  return state.board.reduce((sum, piece) => sum + (piece?.side === side ? PIECE_VALUES[piece.type] : 0), side === 'HAN' ? 1.5 : 0);
}

export function isCheckmate(state: GameState, side: Side = state.turn): boolean {
  // Clearing the stored result lets callers inspect the final mating position as well.
  return isCheck(state, side) && generateLegalMoves({ ...state, result: null }, side).length === 0;
}

export function isBikjang(state: Pick<GameState, 'board' | 'config'>): boolean {
  if (!state.config.bikjang) return false;
  const hanIndex = state.board.findIndex(piece => piece?.side === 'HAN' && piece.type === 'GUNG');
  const choIndex = state.board.findIndex(piece => piece?.side === 'CHO' && piece.type === 'GUNG');
  if (hanIndex < 0 || choIndex < 0) return false;
  const han = fromIndex(hanIndex), cho = fromIndex(choIndex);
  if (han.file !== cho.file) return false;
  for (let rank = Math.min(han.rank, cho.rank) + 1; rank < Math.max(han.rank, cho.rank); rank++) {
    if (pieceAt(state.board, { file: han.file, rank })) return false;
  }
  return true;
}

function scoreResult(state: GameState, reason: string): GameResult {
  const han = calculateScore(state, 'HAN'), cho = calculateScore(state, 'CHO');
  return { status: 'DRAW_BY_SCORE', winner: han > cho ? 'HAN' : cho > han ? 'CHO' : null, reason };
}

export function getGameResult(state: GameState): GameResult {
  if (state.result) return state.result;
  if (isCheckmate(state, state.turn)) return { status: 'CHECKMATE', winner: otherSide(state.turn), reason: '외통' };
  if (isBikjang(state)) return scoreResult(state, '빅장 · 점수 판정');
  const key = positionKey(state.board, state.turn);
  if (state.positionHistory.filter(previous => previous === key).length >= state.config.repetitionCount) {
    return scoreResult(state, `${state.config.repetitionCount}회 동일 국면 · 점수 판정`);
  }
  return { status: 'PLAYING', winner: null, reason: '대국 진행 중' };
}

export function resign(state: GameState, side: Side): GameState {
  if (state.result) throw new Error('이미 끝난 대국입니다.');
  return { ...state, result: { status: 'RESIGNED', winner: otherSide(side), reason: `${side === 'HAN' ? '한' : '초'} 기권` } };
}

export function agreeDraw(state: GameState): GameState {
  if (state.result) throw new Error('이미 끝난 대국입니다.');
  return { ...state, result: scoreResult(state, '합의 비김 · 점수 판정') };
}
