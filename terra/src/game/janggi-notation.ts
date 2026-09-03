import type { Move, Piece, PieceType, Position, Side } from '../engine/types'

const pieceNames: Record<PieceType, string> = {
  GUNG: '궁',
  SA: '사',
  CHA: '차',
  PO: '포',
  MA: '마',
  SANG: '상',
  JOL: '졸',
}

export function sideName(side: Side): string {
  return side === 'HAN' ? '한' : '초'
}

export function pieceName(piece: Piece): string {
  return `${sideName(piece.side)} ${pieceNames[piece.type]}`
}

export function coordinateName(position: Position): string {
  return `${position.file}열 ${position.rank}행`
}

export function formatMove(move: Move): string {
  if (move.isPass || move.from === null || move.to === null || move.piece === null) {
    return '한 수 쉬기'
  }
  return `${coordinateName(move.from)} ${pieceName(move.piece)} ${coordinateName(move.to)}`
}

export function formatMoveCompact(move: Move): string {
  if (move.isPass || move.from === null || move.to === null || move.piece === null) {
    return '쉬기'
  }
  return `${move.from.file}${move.from.rank} ${pieceNames[move.piece.type]} ${move.to.file}${move.to.rank}`
}
