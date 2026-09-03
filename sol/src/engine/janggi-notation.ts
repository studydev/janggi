import type { Move, PieceType, Side } from './types'

export type PieceLabelStyle = 'HANJA' | 'HANGUL'

const HANGUL_LABELS: Record<Side, Record<PieceType, string>> = {
  HAN: { GUNG: '한', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '병' },
  CHO: { GUNG: '초', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸' },
}

const HANJA_LABELS: Record<Side, Record<PieceType, string>> = {
  HAN: { GUNG: '漢', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '兵' },
  CHO: { GUNG: '楚', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '卒' },
}

export function pieceLabel(side: Side, type: PieceType, style: PieceLabelStyle): string {
  return style === 'HANJA' ? HANJA_LABELS[side][type] : HANGUL_LABELS[side][type]
}

export function formatMove(move: Move, style: PieceLabelStyle = 'HANGUL'): string {
  if (move.isPass) return '한 수 쉼'
  if (!move.from || !move.to || !move.piece) return '알 수 없는 수'
  const from = `${move.from.file}-${move.from.rank}`
  const to = `${move.to.file}-${move.to.rank}`
  return `${from} ${pieceLabel(move.piece.side, move.piece.type, style)} ${to}`
}
