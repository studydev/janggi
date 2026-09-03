import { generateLegalMoves, makeMove } from './rules';
import type { GameState } from './types';

/**
 * 합법수 트리의 말단 노드 수. 한 수 쉬기(pass)는 세지 않는다.
 * 규칙을 고치면 이 숫자가 움직이므로 회귀 테스트 기준값으로 쓴다.
 */
export function perft(state: GameState, depth: number): number {
  if (depth <= 0) return 1;
  const moves = generateLegalMoves(state);
  if (depth === 1) return moves.length;

  let nodes = 0;
  for (const move of moves) {
    nodes += perft(makeMove(state, move), depth - 1);
  }
  return nodes;
}

/** 첫 수별 노드 수. 회귀가 깨졌을 때 원인을 좁히는 용도. */
export function perftDivide(state: GameState, depth: number): { move: string; nodes: number }[] {
  return generateLegalMoves(state).map((move) => ({
    move: `${move.from.file}${move.from.rank}-${move.to.file}${move.to.rank}`,
    nodes: perft(makeMove(state, move), depth - 1),
  }));
}
