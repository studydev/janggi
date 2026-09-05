import type { Move, Piece, PieceType, Position, Side } from './types'
import type { ResultReason } from './result'

export type PieceNotation = 'hanja' | 'hangul'
export const SIDE_NAMES: Record<Side, string> = { HAN: '한', CHO: '초' }
const HANJA: Record<PieceType, string> = { GUNG: '楚', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '卒' }
const HANGUL: Record<PieceType, string> = { GUNG: '궁', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸' }
export const RESULT_LABELS: Record<ResultReason, string> = {
  NONE: '대국 중', CHECKMATE: '외통', BIKJANG: '빅장 · 점수승', REPETITION: '국면 반복 · 점수승',
  AGREEMENT: '합의 종료 · 점수승', RESIGNATION: '기권',
}

export function pieceLabel(piece: Pick<Piece, 'type' | 'side'>, notation: PieceNotation = 'hanja'): string {
  if (notation === 'hangul') return piece.type === 'JOL' && piece.side === 'HAN' ? '병' : HANGUL[piece.type]
  if (piece.type === 'GUNG') return piece.side === 'HAN' ? '漢' : '楚'
  if (piece.type === 'JOL') return piece.side === 'HAN' ? '兵' : '卒'
  return HANJA[piece.type]
}

export function formatPosition(position: Position): string {
  return `${position.file},${position.rank}`
}

export function formatMove(move: Move): string {
  if (move.isPass) return '한 수 쉬기'
  if (!move.from || !move.to || !move.piece) throw new Error('Invalid move record')
  return `${formatPosition(move.from)} ${pieceLabel(move.piece, 'hangul')} ${formatPosition(move.to)}`
}

export function pointLabel(position: Position, piece: Piece | null): string {
  const name = piece ? `${SIDE_NAMES[piece.side]} ${pieceLabel(piece, 'hangul')}` : '빈 자리'
  return `${name}, ${position.rank}행 ${position.file}열`
}