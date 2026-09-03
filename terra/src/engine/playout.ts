import { createInitialState } from './board'
import { getGameResult } from './result'
import type { GameResult } from './result'
import { applyLegalMove, generateLegalMoves, isCheck, pass } from './rules'
import type { GameConfig, GameState, Move, Side } from './types'

/** Minimal deterministic PRNG so playouts and verification are reproducible. */
export interface RandomSource {
  next: () => number
}

export function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0
  return {
    next: () => {
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

export interface PlayoutStep {
  ply: number
  side: Side
  move: Move | null
}

export type PlayoutEnd = GameResult['status'] | 'MOVE_LIMIT'

export interface PlayoutResult {
  state: GameState
  result: GameResult
  end: PlayoutEnd
  plies: number
  steps: readonly PlayoutStep[]
}

/**
 * Plays one full game where every move is chosen uniformly at random from the
 * legal set (passing only when there is no legal move and the side is not in
 * check). Pure: depends on the engine only. Used by the console playout script
 * and by the verification harness.
 */
export function playRandomGame(
  seed: number,
  maxPlies = 400,
  config: Partial<GameConfig> = {},
): PlayoutResult {
  const source = mulberry32(seed)
  let state = createInitialState(config)
  const steps: PlayoutStep[] = []

  for (let ply = 1; ply <= maxPlies; ply += 1) {
    const legalMoves = generateLegalMoves(state)

    if (legalMoves.length === 0) {
      if (isCheck(state, state.turn)) {
        break
      }
      steps.push({ ply, side: state.turn, move: null })
      state = pass(state)
    } else {
      const move = legalMoves[Math.floor(source.next() * legalMoves.length)]
      steps.push({ ply, side: state.turn, move })
      state = applyLegalMove(state, move)
    }

    const result = getGameResult(state)
    if (result.status !== 'PLAYING') {
      return { state, result, end: result.status, plies: steps.length, steps }
    }
  }

  return {
    state,
    result: getGameResult(state),
    end: 'MOVE_LIMIT',
    plies: steps.length,
    steps,
  }
}
