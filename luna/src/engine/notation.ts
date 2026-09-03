import type { MoveRecord, Piece, Position } from './types'

export function formatPosition(position: Position): string {
  return `${position.file},${position.rank}`
}

export function pieceName(piece: Piece, korean = true): string {
  if (!korean) {
    const symbols: Record<Piece['type'], string> = {
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
  const names: Record<Piece['type'], string> = {
    GUNG: '궁',
    SA: '사',
    CHA: '차',
    PO: '포',
    MA: '마',
    SANG: '상',
    JOL: piece.side === 'HAN' ? '병' : '졸',
  }
  return names[piece.type]
}

export function formatMoveNotation(move: MoveRecord, korean = true): string {
  if (move.isPass) return '한 수 쉬기'
  const captureSuffix = move.captured === null ? '' : ' x'
  return `${formatPosition(move.from)} ${pieceName(move.piece, korean)}${captureSuffix} ${formatPosition(move.to)}`
}