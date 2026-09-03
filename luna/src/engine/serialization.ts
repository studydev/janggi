import { createGameState, generateLegalMoves, makeMove, pass } from './rules'
import { HORSE_ELEPHANT_SETUP_OPTIONS } from './types'
import type { Board, GameConfig, GameState, MoveRecord, Piece, PieceType, Position, Side } from './types'

const SERIALIZED_VERSION = 1
const PIECE_TYPES: ReadonlyArray<PieceType> = ['GUNG', 'SA', 'CHA', 'PO', 'MA', 'SANG', 'JOL']

interface SerializedGame {
  readonly version: number
  readonly initialBoard: Board
  readonly moveHistory: ReadonlyArray<MoveRecord>
  readonly config: GameConfig
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSide(value: unknown): value is Side {
  return value === 'HAN' || value === 'CHO'
}

function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && PIECE_TYPES.includes(value as PieceType)
}

function isPosition(value: unknown): value is Position {
  if (!isRecord(value)) return false
  const file = value.file
  const rank = value.rank
  return typeof file === 'number' && typeof rank === 'number' && Number.isInteger(file) && Number.isInteger(rank) && file >= 1 && file <= 9 && rank >= 1 && rank <= 10
}

function isPiece(value: unknown): value is Piece {
  return isRecord(value) && typeof value.id === 'string' && isSide(value.side) && isPieceType(value.type)
}

function isBoard(value: unknown): value is Board {
  return Array.isArray(value) && value.length === 90 && value.every((piece) => piece === null || isPiece(piece))
}

function isMoveRecord(value: unknown): value is MoveRecord {
  if (!isRecord(value) || typeof value.isPass !== 'boolean') return false
  if (value.isPass) return value.from === null && value.to === null && value.piece === null && value.captured === null
  return isPosition(value.from) && isPosition(value.to) && isPiece(value.piece) && (value.captured === null || isPiece(value.captured))
}

function parseConfig(value: unknown): GameConfig {
  if (!isRecord(value) || typeof value.bikjangEnabled !== 'boolean' || typeof value.repetitionLimit !== 'number' || !Number.isInteger(value.repetitionLimit) || value.repetitionLimit < 1) {
    throw new Error('저장된 대국의 설정이 올바르지 않습니다.')
  }
  return { bikjangEnabled: value.bikjangEnabled, repetitionLimit: value.repetitionLimit }
}

export function serializeGame(state: GameState): string {
  const payload: SerializedGame = {
    version: SERIALIZED_VERSION,
    initialBoard: state.initialBoard,
    moveHistory: state.moveHistory,
    config: state.config,
  }
  return JSON.stringify(payload, null, 2)
}

export function deserializeGame(serialized: string): GameState {
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    throw new Error('기보 JSON을 읽을 수 없습니다.')
  }
  if (!isRecord(parsed) || parsed.version !== SERIALIZED_VERSION || !isBoard(parsed.initialBoard) || !Array.isArray(parsed.moveHistory) || !parsed.moveHistory.every(isMoveRecord)) {
    throw new Error('지원하지 않는 기보 형식입니다.')
  }
  const config = parseConfig(parsed.config)
  let state = createGameState(parsed.initialBoard, 'CHO', config, parsed.initialBoard)
  for (const savedMove of parsed.moveHistory) {
    if (savedMove.isPass) {
      state = pass(state)
      continue
    }
    const move = generateLegalMoves(state).find((candidate) => candidate.from.file === savedMove.from.file && candidate.from.rank === savedMove.from.rank && candidate.to.file === savedMove.to.file && candidate.to.rank === savedMove.to.rank)
    if (move === undefined) throw new Error('저장된 기보에 현재 규칙과 맞지 않는 수가 있습니다.')
    state = makeMove(state, move)
  }
  return state
}

export function isSupportedSetup(value: unknown): boolean {
  return typeof value === 'string' && HORSE_ELEPHANT_SETUP_OPTIONS.includes(value as (typeof HORSE_ELEPHANT_SETUP_OPTIONS)[number])
}