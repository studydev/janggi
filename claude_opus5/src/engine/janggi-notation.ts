/**
 * 기보 표기. 표기 문자열을 만드는 곳은 이 파일 하나뿐이다.
 * 다른 모듈에서 직접 좌표 문자열을 조립하지 말 것.
 *
 * 좌표 표기: file 한 자리 + rank 한 자리. rank 10 은 '0' 으로 적는다.
 * 좌표계는 RULES.md 를 그대로 따른다 (file 1~9 왼→오, rank 1~10 위→아래).
 * 기본 표기: 「출발좌표 + 기물명 + 도착좌표」  예) 12차14
 */
import { PIECE_HANGUL, PIECE_HANJA, SIDE_LABEL } from './board';
import type { Move, PieceType, Position, Side } from './types';

export type NotationStyle = 'traditional' | 'verbose';
export type PieceLabelStyle = 'hangul' | 'hanja';

export const PASS_NOTATION = '한수쉼';

/** rank 10 은 0 으로 적는다. */
export function formatCoord(p: Position): string {
  const rank = p.rank === 10 ? 0 : p.rank;
  return `${p.file}${rank}`;
}

export function pieceLabel(
  type: PieceType,
  side: Side,
  style: PieceLabelStyle = 'hangul',
): string {
  return style === 'hanja' ? PIECE_HANJA[type][side] : PIECE_HANGUL[type][side];
}

export interface NotationOptions {
  style?: NotationStyle;
  pieceStyle?: PieceLabelStyle;
}

/** 한 수를 표기 문자열로 바꾼다. */
export function formatMove(move: Move, options: NotationOptions = {}): string {
  const { style = 'traditional', pieceStyle = 'hangul' } = options;
  if (move.isPass) return PASS_NOTATION;

  const name = move.piece === null ? '?' : pieceLabel(move.piece, move.side, pieceStyle);

  if (style === 'traditional') {
    return `${formatCoord(move.from)}${name}${formatCoord(move.to)}`;
  }

  const captured =
    move.captured === null ? '' : ` (${pieceLabel(move.captured, oppositeOf(move.side), pieceStyle)} 잡음)`;
  return `${SIDE_LABEL[move.side]} ${name} ${formatCoord(move.from)}→${formatCoord(move.to)}${captured}`;
}

function oppositeOf(side: Side): Side {
  return side === 'HAN' ? 'CHO' : 'HAN';
}

/** 기보 전체를 「1. 초수 한수」 형태의 줄 목록으로 만든다. */
export function formatMoveList(moves: readonly Move[], options: NotationOptions = {}): string[] {
  const lines: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const no = Math.floor(i / 2) + 1;
    const first = moves[i];
    const second = moves[i + 1];
    const a = first ? formatMove(first, options) : '';
    const b = second ? formatMove(second, options) : '';
    lines.push(`${no}. ${a}${b ? '  ' + b : ''}`);
  }
  return lines;
}

/** 한 수를 읽는 화면용 짧은 설명 (접근성 aria-label 등). */
export function describeMove(move: Move, options: NotationOptions = {}): string {
  return formatMove(move, { ...options, style: 'verbose' });
}

/**
 * 소리 내어 읽는 기물 이름.
 * 궁은 기물 면에는 漢/楚 로 새기지만, 읽을 때는 「한(漢) 궁」처럼 「궁」이라고 해야
 * 진영 이름과 겹치지 않는다.
 */
export function spokenPieceName(type: PieceType, side: Side): string {
  return type === 'GUNG' ? '궁' : pieceLabel(type, side, 'hangul');
}

/** 접근성용 지점 설명. 예) "초(楚) 차, 10행 1열" / "빈 지점, 5행 5열" */
export function describeSquare(piece: { type: PieceType; side: Side } | null, p: Position): string {
  const where = `${p.rank}행 ${p.file}열`;
  if (piece === null) return `빈 지점, ${where}`;
  return `${SIDE_LABEL[piece.side]} ${spokenPieceName(piece.type, piece.side)}, ${where}`;
}
