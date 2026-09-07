import { createInitialState, isInPalace } from './board'
import { generatePoMoves } from './moves'
import { getGameResult } from './result'
import {
  generateLegalMoves,
  makeMove,
  passTurn,
  samePosition,
  undoMove,
} from './rules'
import type { GameState, LegalMove } from './types'

export function perft(state: GameState, depth: number, includePass = true): number {
  if (!Number.isInteger(depth) || depth < 0) {
    throw new RangeError('depth는 0 이상의 정수여야 합니다.')
  }
  if (depth === 0) return 1

  const moves = generateLegalMoves(state)
  let nodes = moves.reduce((sum, move) => (
    sum + perft(makeMove(state, move), depth - 1, includePass)
  ), 0)

  if (includePass) {
    try {
      nodes += perft(passTurn(state), depth - 1, includePass)
    } catch {
      // Pass is unavailable while in check.
    }
  }
  return nodes
}

function assertState(state: GameState): void {
  if (state.board.length !== 90) throw new Error('보드 길이가 90이 아닙니다.')
  for (const piece of state.board) {
    if (!piece || (piece.type !== 'GUNG' && piece.type !== 'SA')) continue
    const index = state.board.indexOf(piece)
    const file = index % 9 + 1
    const rank = Math.floor(index / 9) + 1
    if (!isInPalace({ file, rank } as Parameters<typeof isInPalace>[0], piece.side)) {
      throw new Error(`${piece.type}이 궁성을 벗어났습니다.`)
    }
  }
  for (const side of ['HAN', 'CHO'] as const) {
    if (state.board.filter((piece) => piece?.side === side && piece.type === 'GUNG').length !== 1) {
      throw new Error(`${side} 궁의 개수가 올바르지 않습니다.`)
    }
  }

  const lastMove = state.moveHistory.at(-1)
  if (!lastMove || lastMove.isPass || !lastMove.from || !lastMove.to || !lastMove.piece) return
  if (lastMove.piece.type === 'PO' && lastMove.captured?.type === 'PO') {
    throw new Error('포가 포를 잡았습니다.')
  }
  if (lastMove.piece.type === 'PO') {
    const previous = undoMove(state)
    const valid = generatePoMoves(previous.board, lastMove.from)
      .some((destination) => samePosition(destination, lastMove.to as typeof destination))
    if (!valid) throw new Error('포가 포대 규칙을 어겼습니다.')
  }
  if (lastMove.piece.type === 'JOL') {
    const delta = lastMove.to.rank - lastMove.from.rank
    if ((lastMove.piece.side === 'HAN' && delta < 0)
      || (lastMove.piece.side === 'CHO' && delta > 0)) {
      throw new Error('졸 또는 병이 뒤로 이동했습니다.')
    }
  }
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function pickMove(moves: LegalMove[], random: () => number): LegalMove {
  const captures = moves.filter((move) => move.captured)
  const pool = captures.length > 0 && random() < 0.7 ? captures : moves
  return pool[Math.floor(random() * pool.length)]
}

export interface RandomValidationResult {
  readonly games: number
  readonly positions: number
  readonly completed: number
}

export function validateRandomGames(
  games = 1000,
  maxPlies = 400,
  seed = 20260907,
): RandomValidationResult {
  const random = seededRandom(seed)
  let positions = 0
  let completed = 0

  for (let game = 0; game < games; game += 1) {
    let state = createInitialState()
    assertState(state)

    for (let ply = 0; ply < maxPlies; ply += 1) {
      const result = getGameResult(state)
      if (result.status !== 'PLAYING') {
        completed += 1
        break
      }

      const moves = generateLegalMoves(state)
      state = moves.length > 0
        ? makeMove(state, pickMove(moves, random))
        : passTurn(state)
      assertState(state)
      positions += 1
    }
  }

  return { games, positions, completed }
}
