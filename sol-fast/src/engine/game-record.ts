import { createInitialState, isInBoard } from './board'
import { makeMove, passTurn } from './rules'
import type { Formation, GameConfig, GameSetup, GameState, MoveRecord } from './types'

const FORMATIONS = new Set<Formation>(['MSMS', 'SMSM', 'MSSM', 'SMMS'])

interface SavedGame {
  readonly version: 1
  readonly setup: GameSetup
  readonly config: GameConfig
  readonly moves: ReadonlyArray<MoveRecord>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readSavedGame(value: unknown): SavedGame {
  if (!isRecord(value) || value.version !== 1) throw new Error('지원하지 않는 기보 형식입니다.')
  if (!isRecord(value.setup)
    || !FORMATIONS.has(value.setup.han as Formation)
    || !FORMATIONS.has(value.setup.cho as Formation)) {
    throw new Error('기물 배치 정보가 올바르지 않습니다.')
  }
  if (!isRecord(value.config)
    || typeof value.config.bikjang !== 'boolean'
    || !Number.isInteger(value.config.repetitionCount)
    || (value.config.repetitionCount as number) < 2) {
    throw new Error('대국 설정이 올바르지 않습니다.')
  }
  if (!Array.isArray(value.moves)) throw new Error('기보 목록이 없습니다.')

  return {
    version: 1,
    setup: value.setup as unknown as GameSetup,
    config: value.config as unknown as GameConfig,
    moves: value.moves as unknown as ReadonlyArray<MoveRecord>,
  }
}

export function serializeGame(state: GameState): string {
  const saved: SavedGame = {
    version: 1,
    setup: state.setup,
    config: state.config,
    moves: state.moveHistory,
  }
  return JSON.stringify(saved, null, 2)
}

export function replayGame(state: GameState, moveCount: number): GameState {
  const end = Math.max(0, Math.min(Math.trunc(moveCount), state.moveHistory.length))
  let replay = createInitialState(state.setup, state.config)
  for (const record of state.moveHistory.slice(0, end)) {
    if (record.isPass) {
      replay = passTurn(replay)
      continue
    }
    if (!record.from || !record.to || !isInBoard(record.from) || !isInBoard(record.to)) {
      throw new Error('기보에 잘못된 좌표가 있습니다.')
    }
    replay = makeMove(replay, { from: record.from, to: record.to })
  }
  return replay
}

export function parseGame(source: string): GameState {
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch {
    throw new Error('JSON 기보를 읽을 수 없습니다.')
  }

  const saved = readSavedGame(raw)
  const shell = {
    ...createInitialState(saved.setup, saved.config),
    moveHistory: saved.moves,
  }
  return replayGame(shell, saved.moves.length)
}
