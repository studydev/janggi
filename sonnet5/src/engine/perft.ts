// 초기 국면에서 depth n까지의 합법수(패스 포함) 트리 노드 수를 세는 회귀 검증용 함수.
import { canPass, generateLegalMoves, makeMove, pass } from './rules'
import type { GameState } from './types'

export function perft(state: GameState, depth: number): number {
  if (depth === 0) return 1
  let nodes = 0
  for (const move of generateLegalMoves(state)) {
    nodes += perft(makeMove(state, move), depth - 1)
  }
  if (canPass(state)) {
    nodes += perft(pass(state), depth - 1)
  }
  return nodes
}
