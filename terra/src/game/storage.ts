import type { GameState, Move, Piece, PieceSetup, PieceType, Position, Side } from '../engine/types'
import type { PersistedSession } from './session-types'

const STORAGE_KEY = 'terra-janggi-session-v1'

const pieceSetups: readonly PieceSetup[] = [
  'MA_SANG_MA_SANG',
  'SANG_MA_SANG_MA',
  'MA_SANG_SANG_MA',
  'SANG_MA_MA_SANG',
]

const pieceTypes: readonly PieceType[] = ['GUNG', 'SA', 'CHA', 'PO', 'MA', 'SANG', 'JOL']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSide(value: unknown): value is Side {
  return value === 'HAN' || value === 'CHO'
}

function isPosition(value: unknown): value is Position {
  return (
    isRecord(value) &&
    typeof value.file === 'number' &&
    typeof value.rank === 'number' &&
    Number.isInteger(value.file) &&
    Number.isInteger(value.rank) &&
    value.file >= 1 &&
    value.file <= 9 &&
    value.rank >= 1 &&
    value.rank <= 10
  )
}

function isPiece(value: unknown): value is Piece {
  return isRecord(value) && isSide(value.side) && pieceTypes.includes(value.type as PieceType)
}

function isMove(value: unknown): value is Move {
  if (!isRecord(value) || typeof value.isPass !== 'boolean') {
    return false
  }
  return (
    (value.from === null || isPosition(value.from)) &&
    (value.to === null || isPosition(value.to)) &&
    (value.piece === null || isPiece(value.piece)) &&
    (value.captured === null || isPiece(value.captured))
  )
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || !Array.isArray(value.board) || value.board.length !== 90 || !isSide(value.turn)) {
    return false
  }
  if (!value.board.every((piece) => piece === null || isPiece(piece))) {
    return false
  }
  if (!Array.isArray(value.moveHistory) || !value.moveHistory.every(isMove)) {
    return false
  }
  if (!Array.isArray(value.capturedPieces) || !value.capturedPieces.every(isPiece)) {
    return false
  }
  if (!Array.isArray(value.positionHistory) || !value.positionHistory.every((entry) => typeof entry === 'string')) {
    return false
  }
  if (!isRecord(value.config)) {
    return false
  }

  return (
    pieceSetups.includes(value.config.hanSetup as PieceSetup) &&
    pieceSetups.includes(value.config.choSetup as PieceSetup) &&
    typeof value.config.bikjangEnabled === 'boolean' &&
    typeof value.config.repetitionLimit === 'number'
  )
}

function isSessionResult(value: unknown): boolean {
  const resultStatuses = ['PLAYING', 'CHECKMATE', 'DRAW_BY_SCORE', 'DRAW', 'RESIGNED']
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.status === 'string' &&
      resultStatuses.includes(value.status) &&
      (value.winner === null || isSide(value.winner)) &&
      (value.reason === null || typeof value.reason === 'string'))
  )
}

function isPersistedSession(value: unknown): value is PersistedSession {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isGameState(value.game) &&
    isRecord(value.elapsed) &&
    typeof value.elapsed.HAN === 'number' &&
    typeof value.elapsed.CHO === 'number' &&
    typeof value.flipped === 'boolean' &&
    typeof value.colorBlindMode === 'boolean' &&
    typeof value.useKoreanLabels === 'boolean' &&
    isSessionResult(value.result) &&
    typeof value.savedAt === 'string'
  )
}

export function loadSavedSession(): PersistedSession | null {
  try {
    const rawSession = window.localStorage.getItem(STORAGE_KEY)
    if (rawSession === null) {
      return null
    }
    const parsedSession: unknown = JSON.parse(rawSession)
    return isPersistedSession(parsedSession) ? parsedSession : null
  } catch {
    return null
  }
}

export function parseSession(serialized: string): PersistedSession {
  const parsedSession: unknown = JSON.parse(serialized)
  if (!isPersistedSession(parsedSession)) {
    throw new Error('유효한 장기 기보 파일이 아닙니다.')
  }
  return parsedSession
}

export function saveSession(session: PersistedSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSavedSession(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
