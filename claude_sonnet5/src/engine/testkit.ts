/**
 * Test-only helpers for building sparse boards and asserting on move lists.
 * Not used by production code (kept in src for simple tsconfig include).
 */

import { emptyBoard, setPiece, toIndex } from './board'
import type { Board, Piece, PieceType, Position, Side } from './types'

const TYPE_BY_CODE: Record<string, PieceType> = {
  K: 'GUNG',
  S: 'SA',
  R: 'CHA',
  P: 'PO',
  M: 'MA',
  E: 'SANG',
  J: 'JOL',
}

/**
 * Build a board from a compact map. Keys are `"file,rank"`, values are a
 * two-char code: side (`c` = CHO, `h` = HAN) + piece (`K S R P M E J`).
 * e.g. `{ '5,5': 'cR', '5,8': 'hP' }`
 */
export function scene(cells: Record<string, string>): Board {
  let board = emptyBoard()
  for (const [key, code] of Object.entries(cells)) {
    const [file, rank] = key.split(',').map((n) => Number(n.trim()))
    const side: Side = code[0] === 'c' ? 'CHO' : 'HAN'
    const type = TYPE_BY_CODE[code[1].toUpperCase()]
    if (!type) throw new Error(`bad piece code: ${code}`)
    board = setPiece(board, { file, rank }, { side, type })
  }
  return board
}

export function at(file: number, rank: number): Position {
  return { file, rank }
}

export function piece(side: Side, type: PieceType): Piece {
  return { side, type }
}

/** Sort positions into a stable `"file,rank"` string list for comparison. */
export function keys(positions: readonly Position[]): string[] {
  return positions.map((p) => `${p.file},${p.rank}`).sort()
}

export function has(positions: readonly Position[], file: number, rank: number): boolean {
  return positions.some((p) => p.file === file && p.rank === rank)
}

export function indexOfPos(pos: Position): number {
  return toIndex(pos)
}
