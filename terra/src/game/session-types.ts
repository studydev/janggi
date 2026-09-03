import type { GameResultStatus } from '../engine/result'
import type { GameState, Position, Side } from '../engine/types'

export interface ClockState {
  HAN: number
  CHO: number
}

export interface SessionResult {
  status: GameResultStatus | 'RESIGNED'
  winner: Side | null
  reason: string | null
}

export interface PersistedSession {
  version: 1
  game: GameState
  elapsed: ClockState
  flipped: boolean
  colorBlindMode: boolean
  useKoreanLabels: boolean
  result: SessionResult | null
  savedAt: string
}

export interface SessionState {
  screen: 'SETUP' | 'GAME'
  game: GameState
  selected: Position | null
  replayIndex: number | null
  elapsed: ClockState
  flipped: boolean
  colorBlindMode: boolean
  useKoreanLabels: boolean
  result: SessionResult | null
  /** True once the player has dismissed the end-of-game dialog; the result then
      lives in a slim bar instead of blocking the board. Session-only. */
  resultSeen: boolean
  drawOfferBy: Side | null
  restoreCandidate: PersistedSession | null
}
