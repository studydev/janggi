import { hashPosition } from './board'
import { makeMove, pass, undoMove } from './rules'
import type { GameState, Piece, Position } from './types'

interface GameEnvelope {
  readonly format: 'janggi-sol-fast'
  readonly version: 1
  readonly savedAt: string
  readonly state: GameState
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPosition(value: unknown): value is Position {
  return (
    isRecord(value) &&
    Number.isInteger(value.file) &&
    Number.isInteger(value.rank) &&
    Number(value.file) >= 1 &&
    Number(value.file) <= 9 &&
    Number(value.rank) >= 1 &&
    Number(value.rank) <= 10
  )
}

function isPiece(value: unknown): value is Piece {
  const sides = ['HAN', 'CHO']
  const types = ['GUNG', 'SA', 'CHA', 'PO', 'MA', 'SANG', 'JOL']
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    sides.includes(String(value.side)) &&
    types.includes(String(value.type))
  )
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.board) || value.board.length !== 90) return false
  if (!value.board.every((piece) => piece === null || isPiece(piece))) return false
  if (value.turn !== 'HAN' && value.turn !== 'CHO') return false
  if (!Array.isArray(value.capturedPieces) || !value.capturedPieces.every(isPiece)) return false
  if (!Array.isArray(value.positionHistory) || !value.positionHistory.every((entry) => typeof entry === 'string')) {
    return false
  }
  if (!isRecord(value.config)) return false
  if (typeof value.config.bikjangEnabled !== 'boolean') return false
  if (!Number.isInteger(value.config.repetitionCount) || Number(value.config.repetitionCount) < 2) return false
  if (!Array.isArray(value.moveHistory)) return false
  return value.moveHistory.every((move) => {
    if (!isRecord(move) || typeof move.isPass !== 'boolean') return false
    if (move.isPass) return move.from === null && move.to === null
    return isPosition(move.from) && isPosition(move.to) && isPiece(move.piece)
  })
}

export function serializeGame(state: GameState): string {
  const envelope: GameEnvelope = {
    format: 'janggi-sol-fast',
    version: 1,
    savedAt: new Date().toISOString(),
    state,
  }
  return JSON.stringify(envelope, null, 2)
}

export function replayState(liveState: GameState, ply: number): GameState {
  if (!Number.isInteger(ply) || ply < 0 || ply > liveState.moveHistory.length) {
    throw new RangeError('재생 수순이 기보 범위를 벗어났습니다.')
  }

  const records = [...liveState.moveHistory]
  let state = liveState
  while (state.moveHistory.length > 0) state = undoMove(state)

  for (const record of records.slice(0, ply)) {
    if (record.isPass) {
      state = pass(state)
    } else if (record.from && record.to) {
      state = makeMove(state, { from: record.from, to: record.to })
    } else {
      throw new Error('기보에 잘못된 수가 있습니다.')
    }
  }
  return state
}

export function deserializeGame(json: string): GameState {
  try {
    const envelope: unknown = JSON.parse(json)
    if (
      !isRecord(envelope) ||
      envelope.format !== 'janggi-sol-fast' ||
      envelope.version !== 1 ||
      !isGameState(envelope.state)
    ) {
      throw new Error('shape')
    }

    const rebuilt = replayState(envelope.state, envelope.state.moveHistory.length)
    if (
      rebuilt.turn !== envelope.state.turn ||
      hashPosition(rebuilt.board, rebuilt.turn) !== hashPosition(envelope.state.board, envelope.state.turn)
    ) {
      throw new Error('position')
    }
    return rebuilt
  } catch {
    throw new Error('올바른 장기 기보 파일이 아닙니다.')
  }
}