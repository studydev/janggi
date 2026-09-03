// 기물 표기(한자/한글) 중앙 관리. notation.ts와 UI가 모두 이 파일을 통해서만 라벨을 얻는다.
import type { Piece, PieceType, Side } from './types'

type LabelTable = Record<PieceType, string | Record<Side, string>>

const HANJA: LabelTable = {
  CHA: '車',
  PO: '包',
  MA: '馬',
  SANG: '象',
  SA: '士',
  JOL: { HAN: '兵', CHO: '卒' },
  GUNG: { HAN: '漢', CHO: '楚' },
}

const HANGUL: LabelTable = {
  CHA: '차',
  PO: '포',
  MA: '마',
  SANG: '상',
  SA: '사',
  JOL: { HAN: '병', CHO: '졸' },
  GUNG: { HAN: '한', CHO: '초' },
}

function resolve(table: LabelTable, piece: Piece): string {
  const entry = table[piece.type]
  return typeof entry === 'string' ? entry : entry[piece.side]
}

export type PieceScript = 'HANJA' | 'HANGUL'

export function pieceLabel(piece: Piece, script: PieceScript): string {
  return script === 'HANJA' ? resolve(HANJA, piece) : resolve(HANGUL, piece)
}

export const SIDE_NAME_KO: Record<Side, string> = { HAN: '한', CHO: '초' }

/** 기물 종류의 일반 명칭(진영 불문). 졸/병처럼 진영마다 이름이 다른 경우 병기한다. */
export const PIECE_TYPE_NAME_KO: Record<PieceType, string> = {
  GUNG: '궁',
  SA: '사',
  CHA: '차',
  PO: '포',
  MA: '마',
  SANG: '상',
  JOL: '졸/병',
}
