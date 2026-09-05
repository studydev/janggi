import type { Board, GameConfig, GameState, Piece, PieceSetup, PieceType, Position, Side } from './types'

export const BOARD_FILE_COUNT = 9
export const BOARD_RANK_COUNT = 10
export const DEFAULT_CONFIG: GameConfig = { bikjangEnabled: true, repetitionCount: 3 }
export const SETUP_PIECES: Record<PieceSetup, readonly PieceType[]> = {
  MSMS: ['MA', 'SANG', 'MA', 'SANG'],
  SMSM: ['SANG', 'MA', 'SANG', 'MA'],
  MSSM: ['MA', 'SANG', 'SANG', 'MA'],
  SMMS: ['SANG', 'MA', 'MA', 'SANG'],
}

export function isInBoard(position: Position): boolean {
  return Number.isInteger(position.file) && Number.isInteger(position.rank)
    && position.file >= 1 && position.file <= 9 && position.rank >= 1 && position.rank <= 10
}

export function positionToIndex(position: Position): number {
  if (!isInBoard(position)) throw new RangeError('Invalid board position')
  return (position.rank - 1) * 9 + position.file - 1
}

export function indexToPosition(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= 90) throw new RangeError('Invalid board index')
  return { file: index % 9 + 1, rank: Math.floor(index / 9) + 1 }
}

export function samePosition(left: Position, right: Position): boolean {
  return left.file === right.file && left.rank === right.rank
}

export function oppositeSide(side: Side): Side {
  return side === 'HAN' ? 'CHO' : 'HAN'
}

export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1
}

export function isInPalace(position: Position, side: Side): boolean {
  const start = side === 'HAN' ? 1 : 8
  return isInBoard(position) && position.file >= 4 && position.file <= 6
    && position.rank >= start && position.rank <= start + 2
}

export function palaceSideAt(position: Position): Side | null {
  if (isInPalace(position, 'HAN')) return 'HAN'
  if (isInPalace(position, 'CHO')) return 'CHO'
  return null
}

export function isOnPalaceDiagonal(position: Position): boolean {
  const side = palaceSideAt(position)
  return side !== null && Math.abs(position.file - 5) === Math.abs(position.rank - (side === 'HAN' ? 2 : 9))
}

export function getPalaceDiagonalNeighbors(position: Position): Position[] {
  const side = palaceSideAt(position)
  if (!side || !isOnPalaceDiagonal(position)) return []
  return [-1, 1].flatMap((file) => [-1, 1].map((rank) => ({ file: position.file + file, rank: position.rank + rank })))
    .filter((target) => isInPalace(target, side) && isOnPalaceDiagonal(target))
}

export function createEmptyBoard(): Board {
  return Array<Piece | null>(90).fill(null)
}

export function getPiece(board: Board, position: Position): Piece | null {
  return isInBoard(position) ? board[positionToIndex(position)] ?? null : null
}

export function setPiece(board: Board, position: Position, piece: Piece | null): Board {
  const next = [...board]
  next[positionToIndex(position)] = piece
  return next
}

export function createInitialBoard(hanSetup: PieceSetup, choSetup: PieceSetup): Board {
  const board = [...createEmptyBoard()]
  for (const side of ['HAN', 'CHO'] as const) {
    const setup = side === 'HAN' ? hanSetup : choSetup
    if (!Object.hasOwn(SETUP_PIECES, setup)) throw new RangeError('Invalid piece arrangement')
    const home = side === 'HAN' ? 1 : 10
    const place = (type: PieceType, file: number, rank: number) => {
      board[positionToIndex({ file, rank })] = { id: `${side}-${type}-${file}-${rank}`, side, type }
    }
    place('CHA', 1, home)
    place('CHA', 9, home)
    place('SA', 4, home)
    place('SA', 6, home)
    SETUP_PIECES[setup].forEach((type, index) => place(type, [2, 3, 7, 8][index], home))
    place('GUNG', 5, side === 'HAN' ? 2 : 9)
    for (const file of [2, 8]) place('PO', file, side === 'HAN' ? 3 : 8)
    for (const file of [1, 3, 5, 7, 9]) place('JOL', file, side === 'HAN' ? 4 : 7)
  }
  return board
}

export function hashPosition(board: Board, turn: Side): string {
  return `${turn}:${board.map((piece) => piece ? `${piece.side[0]}${piece.type}` : '.').join('|')}`
}

export function createInitialState(
  hanSetup: PieceSetup = 'MSMS',
  choSetup: PieceSetup = 'MSMS',
  config: Partial<GameConfig> = {},
): GameState {
  const resolved = { ...DEFAULT_CONFIG, ...config }
  if (typeof resolved.bikjangEnabled !== 'boolean'
    || !Number.isSafeInteger(resolved.repetitionCount) || resolved.repetitionCount < 2) {
    throw new RangeError('Invalid game configuration')
  }
  const board = createInitialBoard(hanSetup, choSetup)
  return {
    board, turn: 'CHO', moveHistory: [], capturedPieces: [],
    positionHistory: [hashPosition(board, 'CHO')], config: resolved,
  }
}

export function debugPrint(state: GameState): string {
  const labels: Record<PieceType, string> = { GUNG: 'K', SA: 'A', CHA: 'R', PO: 'C', MA: 'H', SANG: 'E', JOL: 'P' }
  const rows = Array.from({ length: 10 }, (_, rank) => {
    const cells = state.board.slice(rank * 9, rank * 9 + 9).map((piece) => {
      if (!piece) return '.'
      return piece.side === 'CHO' ? labels[piece.type] : labels[piece.type].toLowerCase()
    })
    return `${String(rank + 1).padStart(2, '0')} ${cells.join(' ')}`
  })
  return `   1 2 3 4 5 6 7 8 9\n${rows.join('\n')}`
}