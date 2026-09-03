import {
  BOARD_FILES,
  BOARD_RANKS,
  BOARD_SIZE,
  type Board,
  type HorseElephantSetup,
  type Piece,
  type PieceType,
  type Position,
  type Side,
} from './types'
import type { GameState } from './types'

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

export function indexFromPosition(position: Position): number {
  if (!isInBoard(position)) {
    throw new RangeError(`Position is outside the board: ${position.file},${position.rank}`)
  }
  return (position.rank - 1) * BOARD_FILES + position.file - 1
}

export function positionFromIndex(index: number): Position {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) {
    throw new RangeError(`Board index is outside the board: ${index}`)
  }
  return {
    file: (index % BOARD_FILES) + 1,
    rank: Math.floor(index / BOARD_FILES) + 1,
  }
}

export function emptyBoard(): Board {
  return Array<Piece | null>(BOARD_SIZE).fill(null)
}

export function getPiece(board: Board, position: Position): Piece | null {
  return board[indexFromPosition(position)] ?? null
}

export function placePiece(board: Board, position: Position, piece: Piece | null): Board {
  const nextBoard = [...board]
  nextBoard[indexFromPosition(position)] = piece
  return nextBoard
}

export function createPiece(side: Side, type: PieceType, id: string): Piece {
  return { id, side, type }
}

export function isInPalace(position: Position, side: Side): boolean {
  const rankInPalace = side === 'HAN' ? position.rank >= 1 && position.rank <= 3 : position.rank >= 8 && position.rank <= 10
  return rankInPalace && position.file >= 4 && position.file <= 6
}

export function isOnPalaceDiagonal(position: Position): boolean {
  const centerRank = position.rank <= 3 ? 2 : position.rank >= 8 && position.rank <= 10 ? 9 : null
  return centerRank !== null && position.file >= 4 && position.file <= 6 && Math.abs(position.file - 5) === Math.abs(position.rank - centerRank)
}

export function isPalaceDiagonalStep(from: Position, to: Position): boolean {
  const samePalace =
    (isInPalace(from, 'HAN') && isInPalace(to, 'HAN')) ||
    (isInPalace(from, 'CHO') && isInPalace(to, 'CHO'))
  return samePalace && isOnPalaceDiagonal(from) && isOnPalaceDiagonal(to) && Math.abs(to.file - from.file) === 1 && Math.abs(to.rank - from.rank) === 1
}

export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1
}

export function otherSide(side: Side): Side {
  return side === 'HAN' ? 'CHO' : 'HAN'
}

const setupPieces: Record<HorseElephantSetup, readonly ['MA' | 'SANG', 'MA' | 'SANG', 'MA' | 'SANG', 'MA' | 'SANG']> = {
  'MA-SANG-MA-SANG': ['MA', 'SANG', 'MA', 'SANG'],
  'SANG-MA-SANG-MA': ['SANG', 'MA', 'SANG', 'MA'],
  'MA-SANG-SANG-MA': ['MA', 'SANG', 'SANG', 'MA'],
  'SANG-MA-MA-SANG': ['SANG', 'MA', 'MA', 'SANG'],
}

export function createInitialBoard(
  hanSetup: HorseElephantSetup = 'MA-SANG-MA-SANG',
  choSetup: HorseElephantSetup = 'MA-SANG-MA-SANG',
): Board {
  const board = [...emptyBoard()]
  const put = (side: Side, type: PieceType, file: number, rank: number, id: string) => {
    board[indexFromPosition({ file, rank })] = createPiece(side, type, id)
  }

  const putArmy = (side: Side, rank: number, pawnRank: number, setup: HorseElephantSetup) => {
    put(side, 'CHA', 1, rank, `${side}-CHA-1`)
    const pieces = setupPieces[setup]
    put(side, pieces[0], 2, rank, `${side}-${pieces[0]}-2`)
    put(side, pieces[1], 3, rank, `${side}-${pieces[1]}-3`)
    put(side, 'SA', 4, rank, `${side}-SA-4`)
    put(side, 'SA', 6, rank, `${side}-SA-6`)
    put(side, pieces[2], 7, rank, `${side}-${pieces[2]}-7`)
    put(side, pieces[3], 8, rank, `${side}-${pieces[3]}-8`)
    put(side, 'CHA', 9, rank, `${side}-CHA-9`)
    put(side, 'GUNG', 5, rank + (side === 'HAN' ? 1 : -1), `${side}-GUNG-5`)
    put(side, 'PO', 2, rank + (side === 'HAN' ? 2 : -2), `${side}-PO-2`)
    put(side, 'PO', 8, rank + (side === 'HAN' ? 2 : -2), `${side}-PO-8`)
    for (const file of [1, 3, 5, 7, 9]) {
      put(side, 'JOL', file, pawnRank, `${side}-JOL-${file}`)
    }
  }

  putArmy('HAN', 1, 4, hanSetup)
  putArmy('CHO', 10, 7, choSetup)
  return board
}

export function boardKey(board: Board): string {
  return board.map((piece) => (piece === null ? '--' : `${piece.side[0]}${piece.type}`)).join('|')
}

function pieceSymbol(piece: Piece | null): string {
  if (piece === null) return '·'
  const symbols: Record<PieceType, string> = {
    GUNG: piece.side === 'HAN' ? '帥' : '將',
    SA: '士',
    CHA: '車',
    PO: '包',
    MA: '馬',
    SANG: '象',
    JOL: piece.side === 'HAN' ? '兵' : '卒',
  }
  return symbols[piece.type]
}

export function debugPrint(state: GameState): string {
  const lines = [`turn: ${state.turn}`]
  for (let rank = 1; rank <= BOARD_RANKS; rank += 1) {
    const row = []
    for (let file = 1; file <= BOARD_FILES; file += 1) {
      row.push(pieceSymbol(getPiece(state.board, { file, rank })))
    }
    lines.push(`${String(rank).padStart(2, ' ')} ${row.join(' ')}`)
  }
  const output = lines.join('\n')
  console.log(output)
  return output
}