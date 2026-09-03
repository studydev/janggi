import type { Board, GameConfig, GameState, Piece, PieceSetup, PieceType, Position, Side } from './types'
import { DEFAULT_GAME_CONFIG } from './types'

export const BOARD_FILES = 9
export const BOARD_RANKS = 10
export const BOARD_SIZE = BOARD_FILES * BOARD_RANKS

const formationBySetup: Record<PieceSetup, readonly PieceType[]> = {
  MA_SANG_MA_SANG: ['MA', 'SANG', 'MA', 'SANG'],
  SANG_MA_SANG_MA: ['SANG', 'MA', 'SANG', 'MA'],
  MA_SANG_SANG_MA: ['MA', 'SANG', 'SANG', 'MA'],
  SANG_MA_MA_SANG: ['SANG', 'MA', 'MA', 'SANG'],
}

const displayName: Record<PieceType, Record<Side, string>> = {
  GUNG: { HAN: '漢', CHO: '楚' },
  SA: { HAN: '士', CHO: '士' },
  CHA: { HAN: '車', CHO: '車' },
  PO: { HAN: '包', CHO: '包' },
  MA: { HAN: '馬', CHO: '馬' },
  SANG: { HAN: '象', CHO: '象' },
  JOL: { HAN: '兵', CHO: '卒' },
}

export function isInBoard(position: Position): boolean {
  return (
    Number.isInteger(position.file) &&
    Number.isInteger(position.rank) &&
    position.file >= 1 &&
    position.file <= BOARD_FILES &&
    position.rank >= 1 &&
    position.rank <= BOARD_RANKS
  )
}

export function toIndex(position: Position): number {
  if (!isInBoard(position)) {
    throw new RangeError(`Position is outside the board: ${position.file},${position.rank}`)
  }

  return (position.rank - 1) * BOARD_FILES + position.file - 1
}

export function fromIndex(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) {
    throw new RangeError(`Board index is outside the board: ${index}`)
  }

  return {
    file: (index % BOARD_FILES) + 1,
    rank: Math.floor(index / BOARD_FILES) + 1,
  }
}

export function samePosition(left: Position, right: Position): boolean {
  return left.file === right.file && left.rank === right.rank
}

export function shiftPosition(position: Position, fileDelta: number, rankDelta: number): Position {
  return { file: position.file + fileDelta, rank: position.rank + rankDelta }
}

export function getPiece(board: Board, position: Position): Piece | null {
  return board[toIndex(position)] ?? null
}

export function withPiece(board: Board, position: Position, piece: Piece | null): Board {
  const nextBoard = [...board]
  nextBoard[toIndex(position)] = piece
  return nextBoard
}

export function createEmptyBoard(): Board {
  return Array<Piece | null>(BOARD_SIZE).fill(null)
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

export function isOnPalaceDiagonal(position: Position): boolean {
  return (
    (isInPalace(position, 'HAN') && Math.abs(position.file - 5) === Math.abs(position.rank - 2)) ||
    (isInPalace(position, 'CHO') && Math.abs(position.file - 5) === Math.abs(position.rank - 9))
  )
}

export function isPalaceDiagonalStep(from: Position, to: Position): boolean {
  if (Math.abs(from.file - to.file) !== 1 || Math.abs(from.rank - to.rank) !== 1) {
    return false
  }

  const palaceSide = isInPalace(from, 'HAN') && isInPalace(to, 'HAN') ? 'HAN' : isInPalace(from, 'CHO') && isInPalace(to, 'CHO') ? 'CHO' : null
  return palaceSide !== null && isOnPalaceDiagonal(from) && isOnPalaceDiagonal(to)
}

export function palaceDiagonalDirections(position: Position): readonly Position[] {
  if (!isOnPalaceDiagonal(position)) {
    return []
  }

  const directions: Position[] = []
  for (const fileDelta of [-1, 1]) {
    for (const rankDelta of [-1, 1]) {
      const next = shiftPosition(position, fileDelta, rankDelta)
      if (isPalaceDiagonalStep(position, next)) {
        directions.push({ file: fileDelta, rank: rankDelta })
      }
    }
  }

  return directions
}

export function createInitialBoard(hanSetup: PieceSetup, choSetup: PieceSetup): Board {
  const board = Array<Piece | null>(BOARD_SIZE).fill(null)
  const place = (file: number, rank: number, side: Side, type: PieceType): void => {
    board[toIndex({ file, rank })] = { side, type }
  }

  const placeBackRank = (rank: number, side: Side, setup: PieceSetup): void => {
    const formation = formationBySetup[setup]
    place(1, rank, side, 'CHA')
    place(9, rank, side, 'CHA')
    place(4, rank, side, 'SA')
    place(6, rank, side, 'SA')
    for (const [index, file] of [2, 3, 7, 8].entries()) {
      place(file, rank, side, formation[index])
    }
  }

  placeBackRank(1, 'HAN', hanSetup)
  place(5, 2, 'HAN', 'GUNG')
  place(2, 3, 'HAN', 'PO')
  place(8, 3, 'HAN', 'PO')
  for (const file of [1, 3, 5, 7, 9]) {
    place(file, 4, 'HAN', 'JOL')
  }

  placeBackRank(10, 'CHO', choSetup)
  place(5, 9, 'CHO', 'GUNG')
  place(2, 8, 'CHO', 'PO')
  place(8, 8, 'CHO', 'PO')
  for (const file of [1, 3, 5, 7, 9]) {
    place(file, 7, 'CHO', 'JOL')
  }

  return board
}

export function positionKey(board: Board, turn: Side): string {
  return `${turn}:${board
    .map((piece) => (piece === null ? '-' : `${piece.side === 'HAN' ? 'H' : 'C'}${piece.type}`))
    .join('|')}`
}

export function createInitialState(config: Partial<GameConfig> = {}): GameState {
  const gameConfig: GameConfig = { ...DEFAULT_GAME_CONFIG, ...config }
  const board = createInitialBoard(gameConfig.hanSetup, gameConfig.choSetup)

  return {
    board,
    turn: 'CHO',
    moveHistory: [],
    capturedPieces: [],
    config: gameConfig,
    positionHistory: [positionKey(board, 'CHO')],
  }
}

export function pieceLabel(piece: Piece): string {
  return displayName[piece.type][piece.side]
}

export function boardToText(board: Board): string {
  const ranks: string[] = []
  for (let rank = 1; rank <= BOARD_RANKS; rank += 1) {
    const row: string[] = []
    for (let file = 1; file <= BOARD_FILES; file += 1) {
      const piece = getPiece(board, { file, rank })
      row.push(piece === null ? '·' : pieceLabel(piece))
    }
    ranks.push(row.join(' '))
  }
  return ranks.join('\n')
}

export function debugPrint(state: GameState): void {
  console.log(boardToText(state.board))
}