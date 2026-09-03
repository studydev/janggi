/**
 * Board geometry, coordinate conversion, palace helpers, and the initial setup.
 *
 * Pure module. See RULES.md → "보드" and "초기 배치".
 */

import type { Board, Formation, GameConfig, GameState, Piece, PieceType, Position, Side } from './types'
import { DEFAULT_CONFIG } from './types'

export const FILES = 9
export const RANKS = 10
export const CELLS = FILES * RANKS

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

export function inBounds(file: number, rank: number): boolean {
  return (
    Number.isInteger(file) &&
    Number.isInteger(rank) &&
    file >= 1 &&
    file <= FILES &&
    rank >= 1 &&
    rank <= RANKS
  )
}

export function isInBoard(pos: Position): boolean {
  return inBounds(pos.file, pos.rank)
}

export function toIndex(pos: Position): number {
  if (!isInBoard(pos)) {
    throw new RangeError(`Position off board: file ${pos.file}, rank ${pos.rank}`)
  }
  return (pos.rank - 1) * FILES + (pos.file - 1)
}

export function fromIndex(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= CELLS) {
    throw new RangeError(`Board index out of range: ${index}`)
  }
  return { file: (index % FILES) + 1, rank: Math.floor(index / FILES) + 1 }
}

export function posEquals(a: Position, b: Position): boolean {
  return a.file === b.file && a.rank === b.rank
}

export function shift(pos: Position, df: number, dr: number): Position {
  return { file: pos.file + df, rank: pos.rank + dr }
}

// ---------------------------------------------------------------------------
// Board access (immutable)
// ---------------------------------------------------------------------------

export function emptyBoard(): Board {
  return Array<Piece | null>(CELLS).fill(null)
}

export function pieceAt(board: Board, pos: Position): Piece | null {
  return board[toIndex(pos)] ?? null
}

export function setPiece(board: Board, pos: Position, piece: Piece | null): Board {
  const next = board.slice()
  next[toIndex(pos)] = piece
  return next
}

export function opponent(side: Side): Side {
  return side === 'CHO' ? 'HAN' : 'CHO'
}

/** 졸/병이 전진하는 rank 방향. 한(위)은 +1, 초(아래)는 -1. */
export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1
}

// ---------------------------------------------------------------------------
// Palace (궁성)
// ---------------------------------------------------------------------------

/** 궁성 rank 범위: 한 = 1~3, 초 = 8~10. file 은 두 진영 모두 4~6. */
export function isInPalace(pos: Position, side: Side): boolean {
  const minRank = side === 'HAN' ? 1 : 8
  return pos.file >= 4 && pos.file <= 6 && pos.rank >= minRank && pos.rank <= minRank + 2
}

export function isInAnyPalace(pos: Position): boolean {
  return isInPalace(pos, 'HAN') || isInPalace(pos, 'CHO')
}

/** 궁성 중앙점. */
function palaceCenterRank(side: Side): number {
  return side === 'HAN' ? 2 : 9
}

/** 궁성에 그어진 대각선 위의 점인가 (중앙 + 네 귀퉁이). */
export function isOnPalaceDiagonal(pos: Position): boolean {
  for (const side of ['HAN', 'CHO'] as const) {
    if (isInPalace(pos, side) && Math.abs(pos.file - 5) === Math.abs(pos.rank - palaceCenterRank(side))) {
      return true
    }
  }
  return false
}

function samePalace(a: Position, b: Position): boolean {
  return (
    (isInPalace(a, 'HAN') && isInPalace(b, 'HAN')) ||
    (isInPalace(a, 'CHO') && isInPalace(b, 'CHO'))
  )
}

/**
 * from → to 가 궁성 대각선을 따라가는 한 칸 이동인가.
 * 대각선상 인접한 두 점은 언제나 "중앙 ↔ 귀퉁이" 쌍뿐이므로,
 * 양 끝점이 대각선 위에 있고 같은 궁성이면 충분하다.
 */
export function isPalaceDiagonalStep(from: Position, to: Position): boolean {
  return (
    Math.abs(from.file - to.file) === 1 &&
    Math.abs(from.rank - to.rank) === 1 &&
    samePalace(from, to) &&
    isOnPalaceDiagonal(from) &&
    isOnPalaceDiagonal(to)
  )
}

/** pos 에서 출발 가능한 궁성 대각선 방향들 (차·포의 대각 직진용). */
export function palaceDiagonalDirs(pos: Position): readonly { df: number; dr: number }[] {
  if (!isOnPalaceDiagonal(pos)) return []
  const dirs: { df: number; dr: number }[] = []
  for (const df of [-1, 1]) {
    for (const dr of [-1, 1]) {
      if (isPalaceDiagonalStep(pos, shift(pos, df, dr))) {
        dirs.push({ df, dr })
      }
    }
  }
  return dirs
}

// ---------------------------------------------------------------------------
// Initial setup
// ---------------------------------------------------------------------------

/** file [2, 3, 7, 8] 에 놓이는 기물 (마·상 배치). */
export function formationPieces(formation: Formation): [PieceType, PieceType, PieceType, PieceType] {
  const M: PieceType = 'MA'
  const S: PieceType = 'SANG'
  switch (formation) {
    case 'MSMS':
      return [M, S, M, S]
    case 'SMSM':
      return [S, M, S, M]
    case 'MSSM':
      return [M, S, S, M]
    case 'SMMS':
      return [S, M, M, S]
  }
}

export function createInitialBoard(hanFormation: Formation, choFormation: Formation): Board {
  let board = emptyBoard()
  const put = (file: number, rank: number, side: Side, type: PieceType): void => {
    board = setPiece(board, { file, rank }, { side, type })
  }

  const layoutSide = (side: Side, backRank: number, formation: Formation): void => {
    const dir = forwardDir(side)
    const [f2, f3, f7, f8] = formationPieces(formation)
    put(1, backRank, side, 'CHA')
    put(2, backRank, side, f2)
    put(3, backRank, side, f3)
    put(4, backRank, side, 'SA')
    put(6, backRank, side, 'SA')
    put(7, backRank, side, f7)
    put(8, backRank, side, f8)
    put(9, backRank, side, 'CHA')
    // 궁은 back rank 에서 한 칸 안쪽.
    put(5, backRank + dir, side, 'GUNG')
    // 포는 두 칸 안쪽 file 2·8.
    put(2, backRank + 2 * dir, side, 'PO')
    put(8, backRank + 2 * dir, side, 'PO')
    // 졸/병은 세 칸 안쪽 file 1·3·5·7·9.
    for (const file of [1, 3, 5, 7, 9]) {
      put(file, backRank + 3 * dir, side, 'JOL')
    }
  }

  layoutSide('HAN', 1, hanFormation)
  layoutSide('CHO', 10, choFormation)
  return board
}

// ---------------------------------------------------------------------------
// State construction
// ---------------------------------------------------------------------------

export function createInitialState(config: Partial<GameConfig> = {}): GameState {
  const merged: GameConfig = { ...DEFAULT_CONFIG, ...config }
  return {
    board: createInitialBoard(merged.hanFormation, merged.choFormation),
    turn: 'CHO', // 초(楚)가 선수.
    moveHistory: [],
    capturedPieces: [],
    config: merged,
  }
}

// ---------------------------------------------------------------------------
// Hashing & debug
// ---------------------------------------------------------------------------

const CODE: Record<PieceType, string> = {
  GUNG: 'K',
  SA: 'S',
  CHA: 'R',
  PO: 'P',
  MA: 'M',
  SANG: 'E',
  JOL: 'J',
}

/** 반복 국면 감지를 위한 (보드 + 차례) 해시. */
export function positionKey(board: Board, turn: Side): string {
  let key = turn === 'CHO' ? 'c|' : 'h|'
  for (const cell of board) {
    key += cell === null ? '.' : (cell.side === 'CHO' ? '' : '-') + CODE[cell.type]
  }
  return key
}

const HANJA: Record<PieceType, Record<Side, string>> = {
  GUNG: { CHO: '楚', HAN: '漢' },
  SA: { CHO: '士', HAN: '士' },
  CHA: { CHO: '車', HAN: '車' },
  PO: { CHO: '包', HAN: '包' },
  MA: { CHO: '馬', HAN: '馬' },
  SANG: { CHO: '象', HAN: '象' },
  JOL: { CHO: '卒', HAN: '兵' },
}

export function pieceGlyph(piece: Piece): string {
  return HANJA[piece.type][piece.side]
}

export function boardToString(board: Board): string {
  const lines: string[] = []
  for (let rank = 1; rank <= RANKS; rank += 1) {
    const cells: string[] = []
    for (let file = 1; file <= FILES; file += 1) {
      const piece = pieceAt(board, { file, rank })
      cells.push(piece === null ? '·' : pieceGlyph(piece))
    }
    lines.push(`${String(rank).padStart(2, ' ')} ${cells.join(' ')}`)
  }
  lines.push('   ' + [1, 2, 3, 4, 5, 6, 7, 8, 9].join(' '))
  return lines.join('\n')
}

export function debugPrint(state: GameState): void {
  console.log(`${boardToString(state.board)}\n차례: ${state.turn === 'CHO' ? '초(楚)' : '한(漢)'}`)
}
