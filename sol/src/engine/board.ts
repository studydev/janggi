import type {
  Board,
  GameConfig,
  GameState,
  Piece,
  PieceSetup,
  PieceType,
  Position,
  Side,
} from './types'

export const BOARD_FILE_COUNT = 9
export const BOARD_RANK_COUNT = 10

export const DEFAULT_CONFIG: GameConfig = {
  bikjangEnabled: true,
  repetitionCount: 3,
}

const SETUP_PIECES: Record<PieceSetup, readonly PieceType[]> = {
  MSMS: ['MA', 'SANG', 'MA', 'SANG'],
  SMSM: ['SANG', 'MA', 'SANG', 'MA'],
  MSSM: ['MA', 'SANG', 'SANG', 'MA'],
  SMMS: ['SANG', 'MA', 'MA', 'SANG'],
}

const DEBUG_LABELS: Record<Side, Record<PieceType, string>> = {
  HAN: { GUNG: '漢', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '兵' },
  CHO: { GUNG: '楚', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '卒' },
}

export function isInBoard(position: Position): boolean {
  return (
    Number.isInteger(position.file) &&
    Number.isInteger(position.rank) &&
    position.file >= 1 &&
    position.file <= BOARD_FILE_COUNT &&
    position.rank >= 1 &&
    position.rank <= BOARD_RANK_COUNT
  )
}

export function positionToIndex(position: Position): number {
  if (!isInBoard(position)) {
    throw new RangeError(`Invalid board position: ${position.file},${position.rank}`)
  }
  return (position.rank - 1) * BOARD_FILE_COUNT + position.file - 1
}

export function indexToPosition(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_FILE_COUNT * BOARD_RANK_COUNT) {
    throw new RangeError(`Invalid board index: ${index}`)
  }
  return {
    file: (index % BOARD_FILE_COUNT) + 1,
    rank: Math.floor(index / BOARD_FILE_COUNT) + 1,
  }
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
  const rankStart = side === 'HAN' ? 1 : 8
  return position.file >= 4 && position.file <= 6 && position.rank >= rankStart && position.rank <= rankStart + 2
}

export function palaceSideAt(position: Position): Side | null {
  if (isInPalace(position, 'HAN')) return 'HAN'
  if (isInPalace(position, 'CHO')) return 'CHO'
  return null
}

export function isOnPalaceDiagonal(position: Position): boolean {
  const palaceSide = palaceSideAt(position)
  if (!palaceSide) return false
  const centerRank = palaceSide === 'HAN' ? 2 : 9
  return Math.abs(position.file - 5) === Math.abs(position.rank - centerRank)
}

export function getPalaceDiagonalNeighbors(position: Position): Position[] {
  const palaceSide = palaceSideAt(position)
  if (!palaceSide || !isOnPalaceDiagonal(position)) return []

  const candidates = [
    { file: position.file - 1, rank: position.rank - 1 },
    { file: position.file + 1, rank: position.rank - 1 },
    { file: position.file - 1, rank: position.rank + 1 },
    { file: position.file + 1, rank: position.rank + 1 },
  ]
  return candidates.filter(
    (candidate) => isInPalace(candidate, palaceSide) && isOnPalaceDiagonal(candidate),
  )
}

export function isPalaceDiagonalStep(from: Position, to: Position): boolean {
  return getPalaceDiagonalNeighbors(from).some((candidate) => samePosition(candidate, to))
}

export function createEmptyBoard(): Board {
  return Array<Piece | null>(BOARD_FILE_COUNT * BOARD_RANK_COUNT).fill(null)
}

export function getPiece(board: Board, position: Position): Piece | null {
  if (!isInBoard(position)) return null
  return board[positionToIndex(position)] ?? null
}

export function setPiece(board: Board, position: Position, piece: Piece | null): Board {
  const nextBoard = [...board]
  nextBoard[positionToIndex(position)] = piece
  return nextBoard
}

function pieceId(side: Side, type: PieceType, ordinal: number): string {
  return `${side}-${type}-${ordinal}`
}

export function createInitialBoard(hanSetup: PieceSetup, choSetup: PieceSetup): Board {
  const board = [...createEmptyBoard()]
  const ordinals: Record<Side, Record<PieceType, number>> = {
    HAN: { GUNG: 0, SA: 0, CHA: 0, PO: 0, MA: 0, SANG: 0, JOL: 0 },
    CHO: { GUNG: 0, SA: 0, CHA: 0, PO: 0, MA: 0, SANG: 0, JOL: 0 },
  }

  const place = (side: Side, type: PieceType, position: Position) => {
    ordinals[side][type] += 1
    board[positionToIndex(position)] = {
      id: pieceId(side, type, ordinals[side][type]),
      side,
      type,
    }
  }

  const placeSide = (side: Side, setup: PieceSetup) => {
    const homeRank = side === 'HAN' ? 1 : 10
    const gungRank = side === 'HAN' ? 2 : 9
    const poRank = side === 'HAN' ? 3 : 8
    const jolRank = side === 'HAN' ? 4 : 7
    const setupFiles = [2, 3, 7, 8]

    place(side, 'CHA', { file: 1, rank: homeRank })
    SETUP_PIECES[setup].forEach((type, index) => {
      place(side, type, { file: setupFiles[index], rank: homeRank })
    })
    place(side, 'SA', { file: 4, rank: homeRank })
    place(side, 'SA', { file: 6, rank: homeRank })
    place(side, 'CHA', { file: 9, rank: homeRank })
    place(side, 'GUNG', { file: 5, rank: gungRank })
    place(side, 'PO', { file: 2, rank: poRank })
    place(side, 'PO', { file: 8, rank: poRank })
    for (const file of [1, 3, 5, 7, 9]) {
      place(side, 'JOL', { file, rank: jolRank })
    }
  }

  placeSide('HAN', hanSetup)
  placeSide('CHO', choSetup)
  return board
}

export function hashPosition(board: Board, turn: Side): string {
  const points = board.map((piece) => (piece ? `${piece.side[0]}${piece.type}` : '.')).join('|')
  return `${turn}:${points}`
}

export function createInitialState(
  hanSetup: PieceSetup = 'MSMS',
  choSetup: PieceSetup = 'MSMS',
  config: Partial<GameConfig> = {},
): GameState {
  const board = createInitialBoard(hanSetup, choSetup)
  const resolvedConfig = { ...DEFAULT_CONFIG, ...config }
  return {
    board,
    turn: 'CHO',
    moveHistory: [],
    capturedPieces: [],
    positionHistory: [hashPosition(board, 'CHO')],
    config: resolvedConfig,
  }
}

export function debugPrint(state: GameState): string {
  const rows: string[] = []
  for (let rank = 1; rank <= BOARD_RANK_COUNT; rank += 1) {
    const cells: string[] = []
    for (let file = 1; file <= BOARD_FILE_COUNT; file += 1) {
      const piece = getPiece(state.board, { file, rank })
      cells.push(piece ? DEBUG_LABELS[piece.side][piece.type] : '·')
    }
    rows.push(`${String(rank).padStart(2, '0')} ${cells.join(' ')}`)
  }
  return `   1 2 3 4 5 6 7 8 9\n${rows.join('\n')}`
}