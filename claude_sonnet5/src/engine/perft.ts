/**
 * perft — 주어진 깊이까지 합법수 트리의 잎 노드 수를 센다.
 *
 * 규칙 엔진의 회귀 테스트 기준값으로 쓴다. 여기서 "합법수"는 generateLegalMoves
 * 의 결과만 뜻하며 한 수 쉬기(pass)는 세지 않는다 (pass 를 넣으면 pass-pass
 * 루프로 트리가 무한히 커진다).
 */

import { applyMove, generateLegalMoves } from './rules'
import type { GameState } from './types'

export function perft(state: GameState, depth: number): number {
  if (depth <= 0) return 1
  const moves = generateLegalMoves(state)
  if (depth === 1) return moves.length

  let nodes = 0
  for (const move of moves) {
    nodes += perft(applyMove(state, move), depth - 1)
  }
  return nodes
}

/** 루트에서 각 첫 수별 하위 노드 수 (디버깅용 divide). */
export function perftDivide(state: GameState, depth: number): { move: string; nodes: number }[] {
  return generateLegalMoves(state).map((move) => ({
    move: `${move.from!.file}${move.from!.rank}->${move.to!.file}${move.to!.rank}`,
    nodes: depth <= 1 ? 1 : perft(applyMove(state, move), depth - 1),
  }))
}
