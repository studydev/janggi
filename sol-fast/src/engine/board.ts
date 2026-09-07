import type {
  Board,
  FileNumber,
  Formation,
  GameConfig,
  GameSetup,
  GameState,
  Piece,
  PieceType,
  Position,
  RankNumber,
  Side,
} from './types'

export const BOARD_FILES = 9
export const BOARD_RANKS = 10
export const BOARD_SIZE = BOARD_FILES * BOARD_RANKS

export const DEFAULT_CONFIG: GameConfig = {
  bikjang: true,
  repetitionCount: 3,
}

export const DEFAULT_SETUP: GameSetup = {
  han: 'MSMS',
  cho: 'MSMS',
}

const FORMATIONS: Record<Formation, ReadonlyArray<PieceType>> = {
  MSMS: ['MA', 'SANG', 'MA', 'SANG'],
  SMSM: ['SANG', 'MA', 'SANG', 'MA'],
  MSSM: ['MA', 'SANG', 'SANG', 'MA'],
  SMMS: ['SANG', 'MA', 'MA', 'SANG'],
}

export function isInBoard(position: { file: number; rank: number }): position is Position {
  return Number.isInteger(position.file)
    && Number.isInteger(position.rank)
    && position.file >= 1
    && position.file <= BOARD_FILES
    && position.rank >= 1
    && position.rank <= BOARD_RANKS
}

export function toPosition(file: number, rank: number): Position | null {
  const candidate = { file, rank }
  return isInBoard(candidate) ? candidate : null
}

export function positionToIndex(position: Position): number {
  return (position.rank - 1) * BOARD_FILES + position.file - 1
}

export function indexToPosition(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) {
    throw new RangeError(`Invalid board index: ${index}`)
  }

  return {
    file: (index % BOARD_FILES + 1) as FileNumber,
    rank: (Math.floor(index / BOARD_FILES) + 1) as RankNumber,
  }
}

export function getPiece(board: Board, position: Position): Piece | null {
  return board[positionToIndex(position)] ?? null
}

export function createEmptyBoard(): Array<Piece | null> {
  return Array.from({ length: BOARD_SIZE }, () => null)
}

export function createPiece(side: Side, type: PieceType, id = `${side}-${type}`): Piece {
  return { id, side, type }
}

export function oppositeSide(side: Side): Side {
  return side === 'HAN' ? 'CHO' : 'HAN'
}

export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1
}

export function isInPalace(position: Position, side: Side): boolean {
  const rankStart = side === 'HAN' ? 1 : 8
  return position.file >= 4
    && position.file <= 6
    && position.rank >= rankStart
    && position.rank <= rankStart + 2
}

export function palaceSideAt(position: Position): Side | null {
  if (isInPalace(position, 'HAN')) return 'HAN'
  if (isInPalace(position, 'CHO')) return 'CHO'
  return null
}

export function isOnPalaceDiagonal(position: Position): boolean {
  const side = palaceSideAt(position)
  if (!side) return false

  const centerRank = side === 'HAN' ? 2 : 9
  const fileOffset = Math.abs(position.file - 5)
  const rankOffset = Math.abs(position.rank - centerRank)
  return fileOffset === rankOffset
}

function place(
  board: Array<Piece | null>,
  side: Side,
  type: PieceType,
  file: number,
  rank: number,
): void {
  const position = toPosition(file, rank)
  if (!position) throw new RangeError(`Invalid initial position: ${file}, ${rank}`)
  board[positionToIndex(position)] = createPiece(side, type, `${side}-${type}-${file}-${rank}`)
}

function placeSide(board: Array<Piece | null>, side: Side, rank: number, formation: Formation): void {
  place(board, side, 'CHA', 1, rank)
  place(board, side, 'CHA', 9, rank)
  place(board, side, 'SA', 4, rank)
  place(board, side, 'SA', 6, rank)

  const formationFiles = [2, 3, 7, 8]
  FORMATIONS[formation].forEach((type, index) => {
    place(board, side, type, formationFiles[index], rank)
  })

  const direction = side === 'HAN' ? 1 : -1
  place(board, side, 'GUNG', 5, rank + direction)
  place(board, side, 'PO', 2, rank + direction * 2)
  place(board, side, 'PO', 8, rank + direction * 2)
  for (const file of [1, 3, 5, 7, 9]) {
    place(board, side, 'JOL', file, rank + direction * 3)
  }
}

export function createInitialBoard(
  hanSetup: Formation = DEFAULT_SETUP.han,
  choSetup: Formation = DEFAULT_SETUP.cho,
): Board {
  const board = createEmptyBoard()
  placeSide(board, 'HAN', 1, hanSetup)
  placeSide(board, 'CHO', 10, choSetup)
  return board
}

export function positionHash(board: Board, turn: Side): string {
  const encodedBoard = board
    .map((piece) => piece ? `${piece.side[0]}${piece.type}` : '-')
    .join(',')
  return `${turn}|${encodedBoard}`
}

export function createInitialState(
  setup: GameSetup = DEFAULT_SETUP,
  config: GameConfig = DEFAULT_CONFIG,
): GameState {
  const board = createInitialBoard(setup.han, setup.cho)
  return {
    board,
    turn: 'CHO',
    moveHistory: [],
    capturedPieces: [],
    config: { ...config },
    setup: { ...setup },
    positionHistory: [positionHash(board, 'CHO')],
  }
}

const DEBUG_SYMBOLS: Record<Side, Record<PieceType, string>> = {
  HAN: { GUNG: '漢', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '兵' },
  CHO: { GUNG: '楚', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '卒' },
}

export function debugPrint(state: GameState): string {
  const rows: string[] = []
  for (let rank = 1; rank <= BOARD_RANKS; rank += 1) {
    const cells: string[] = []
    for (let file = 1; file <= BOARD_FILES; file += 1) {
      const position = toPosition(file, rank)
      const piece = position ? getPiece(state.board, position) : null
      cells.push(piece ? DEBUG_SYMBOLS[piece.side][piece.type] : '·')
    }
    rows.push(`${String(rank).padStart(2, ' ')} ${cells.join(' ')}`)
  }
  return `   1 2 3 4 5 6 7 8 9\n${rows.join('\n')}\nturn: ${state.turn}`
}
