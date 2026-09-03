import { generateLegalMoves, makeMove } from './rules'
import type { GameState } from './types'

export function perft(state: GameState, depth: number): number {
  if (depth <= 0) return 1
  return generateLegalMoves(state).reduce((nodes, move) => nodes + perft(makeMove(state, move), depth - 1), 0)
}