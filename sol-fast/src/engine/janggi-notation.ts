import type { MoveRecord, Piece, Position } from './types'

const PIECE_NAMES = {
  HAN: { GUNG: '한', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '병' },
  CHO: { GUNG: '초', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸' },
} as const

export function getPieceName(piece: Piece): string {
  return PIECE_NAMES[piece.side][piece.type]
}

export function formatPosition(position: Position): string {
  return `${position.file}${position.rank}`
}

export function formatMove(record: MoveRecord): string {
  if (record.isPass) return '한 수 쉼'
  if (!record.from || !record.to || !record.piece) return '알 수 없는 수'
  return `${formatPosition(record.from)} ${getPieceName(record.piece)} ${formatPosition(record.to)}`
}
