import { z } from 'zod'
import { createInitialState } from './board'
import { getGameResult, resignGame, scoreAgreement } from './result'
import type { GameResult } from './result'
import { makeMove, pass, undoMove } from './rules'
import type { GameState, Piece, PieceSetup } from './types'

export const MAX_RECORD_BYTES = 2_000_000
export const MAX_RECORD_MOVES = 5_000
export type ManualConclusion = 'RESIGNATION' | 'AGREEMENT'
export interface InitialSetup { hanSetup: PieceSetup; choSetup: PieceSetup }
export interface LoadedGame {
  game: GameState
  initial: InitialSetup
  elapsedMs: number
  result: GameResult
}

const setupSchema = z.enum(['MSMS', 'SMSM', 'MSSM', 'SMMS'])
const positionSchema = z.object({ file: z.number().int().min(1).max(9), rank: z.number().int().min(1).max(10) }).strict()
const pieceSchema = z.object({
  id: z.string().min(1).max(64), side: z.enum(['HAN', 'CHO']), type: z.enum(['GUNG', 'SA', 'CHA', 'PO', 'MA', 'SANG', 'JOL']),
}).strict()
const moveSchema = z.discriminatedUnion('isPass', [
  z.object({ isPass: z.literal(true), from: z.null(), to: z.null(), piece: z.null(), captured: z.null() }).strict(),
  z.object({ isPass: z.literal(false), from: positionSchema, to: positionSchema, piece: pieceSchema, captured: pieceSchema.nullable() }).strict(),
])
const recordSchema = z.object({
  format: z.literal('astra-janggi'),
  version: z.literal(1),
  initial: z.object({ hanSetup: setupSchema, choSetup: setupSchema }).strict(),
  config: z.object({ bikjangEnabled: z.boolean(), repetitionCount: z.number().int().min(2) }).strict(),
  moves: z.array(moveSchema).max(MAX_RECORD_MOVES),
  elapsedMs: z.number().nonnegative(),
  conclusion: z.enum(['RESIGNATION', 'AGREEMENT']).nullable(),
}).strict()

function samePiece(left: Piece | null, right: Piece | null): boolean {
  if (left === null || right === null) return left === right
  return left.id === right.id && left.type === right.type && left.side === right.side
}

export function exportGame(
  game: GameState,
  initial: InitialSetup,
  metadata: { elapsedMs?: number; conclusion?: ManualConclusion | null } = {},
): string {
  const record = recordSchema.parse({
    format: 'astra-janggi', version: 1,
    initial: { hanSetup: initial.hanSetup, choSetup: initial.choSetup },
    config: game.config, moves: game.moveHistory,
    elapsedMs: metadata.elapsedMs ?? 0, conclusion: metadata.conclusion ?? null,
  })
  const json = JSON.stringify(record, null, 2)
  if (json.length > MAX_RECORD_BYTES) throw new Error('Game record is too large')
  return json
}

export function importGame(json: string): LoadedGame {
  if (json.length > MAX_RECORD_BYTES) throw new Error('Game record is too large')
  const record = recordSchema.parse(JSON.parse(json))
  let game = createInitialState(record.initial.hanSetup, record.initial.choSetup, record.config)
  for (const move of record.moves) {
    if (getGameResult(game).status !== 'PLAYING') throw new Error('Record continues after game ended')
    game = move.isPass ? pass(game) : makeMove(game, { from: move.from, to: move.to })
    const actual = game.moveHistory.at(-1)!
    if (!samePiece(actual.piece, move.piece) || !samePiece(actual.captured, move.captured)) {
      throw new Error('Move metadata does not match the board')
    }
  }
  const result = record.conclusion === 'RESIGNATION' ? resignGame(game)
    : record.conclusion === 'AGREEMENT' ? scoreAgreement(game) : getGameResult(game)
  return { game, initial: record.initial, elapsedMs: record.elapsedMs, result }
}

export function stateAtMove(game: GameState, cursor: number): GameState {
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > game.moveHistory.length) throw new RangeError('Invalid replay cursor')
  let current = game
  while (current.moveHistory.length > cursor) current = undoMove(current)
  return current
}