import type { Move, PieceType, Side } from './types';
import type { Position } from './types';

export type LabelMode = 'HANJA' | 'HANGUL';

/** 한자 표기. 한(漢)과 초(楚)는 궁과 졸/병의 글자가 다르다. */
const HANJA: Readonly<Record<Side, Record<PieceType, string>>> = {
  HAN: { GUNG: '漢', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '兵' },
  CHO: { GUNG: '楚', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '卒' },
};

const HANGUL: Readonly<Record<Side, Record<PieceType, string>>> = {
  HAN: { GUNG: '한', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '병' },
  CHO: { GUNG: '초', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸' },
};

export function pieceLabel(side: Side, type: PieceType, mode: LabelMode = 'HANJA'): string {
  return mode === 'HANJA' ? HANJA[side][type] : HANGUL[side][type];
}

export function pieceName(side: Side, type: PieceType): string {
  return HANGUL[side][type];
}

export const SIDE_NAME: Readonly<Record<Side, string>> = { HAN: '한', CHO: '초' };

/** 좌표 표기: file + rank. rank 10은 0으로 적는다. (예: file 1, rank 10 → "10") */
export function coordinateText(pos: Position): string {
  return `${pos.file}${pos.rank === 10 ? 0 : pos.rank}`;
}

/** 사람이 읽는 수 표기: 출발좌표 + 기물명 + 도착좌표. 문자열 조립은 이 파일에서만 한다. */
export function moveText(move: Move): string {
  if (move.isPass) return '한수쉼';
  return `${coordinateText(move.from)}${pieceName(move.side, move.piece)}${coordinateText(move.to)}`;
}

export function moveLineText(move: Move, ply: number): string {
  const number = Math.floor(ply / 2) + 1;
  const captured = move.captured ? ` ×${pieceName(move.side === 'HAN' ? 'CHO' : 'HAN', move.captured)}` : '';
  return `${number}. ${SIDE_NAME[move.side]} ${moveText(move)}${captured}`;
}

/** 스크린 리더용 지점 설명. */
export function positionAriaLabel(pos: Position): string {
  return `${pos.rank}행 ${pos.file}열`;
}

export function pieceAriaLabel(side: Side, type: PieceType, pos: Position): string {
  return `${SIDE_NAME[side]} ${pieceName(side, type)}, ${positionAriaLabel(pos)}`;
}
