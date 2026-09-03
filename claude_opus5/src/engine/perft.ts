/**
 * perft — 합법수 트리의 노드 수를 센다. 규칙 엔진의 회귀 테스트 기준값으로 쓴다.
 *
 * 한 수 쉬기(pass)는 세지 않는다. 모든 국면에서 항상 1을 더하는 상수라
 * 기물 이동 규칙의 회귀를 잡아내는 데 도움이 되지 않기 때문이다.
 */
import { generateLegalMoves, makeMove } from './rules';
import type { GameState } from './types';

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

/** 첫 수별 분해. 디버깅용. */
export function perftDivide(state: GameState, depth: number): { move: string; nodes: number }[] {
  const out: { move: string; nodes: number }[] = [];
  for (const move of generateLegalMoves(state)) {
    const nodes = depth <= 1 ? 1 : perft(makeMove(state, move), depth - 1);
    out.push({
      move: `${move.from.file}${move.from.rank}-${move.to.file}${move.to.rank}`,
      nodes,
    });
  }
  return out;
}
