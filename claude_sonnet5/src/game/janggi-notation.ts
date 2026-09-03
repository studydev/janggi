/**
 * 기보 표기 — **이 파일이 유일한 표기 조립 지점이다.**
 * 다른 어떤 곳에서도 좌표/기물명 문자열을 직접 만들지 않는다 (CLAUDE.md).
 *
 * 표기 형식(RULES 프롬프트 P9): "출발좌표 + 기물명 + 도착좌표".
 * 좌표는 파일·랭크를 가운뎃점으로 이어 rank 10 도 모호하지 않게 쓴다: 예) 1·7.
 */

import type { Move, Piece, PieceType, Position, Side } from '../engine/types'

const PIECE_KO: Record<PieceType, string> = {
  GUNG: '궁',
  SA: '사',
  CHA: '차',
  PO: '포',
  MA: '마',
  SANG: '상',
  JOL: '졸',
}

/** 졸/병은 진영에 따라 이름이 다르다 (초 = 졸, 한 = 병). 나머지는 공통. */
export function pieceKoreanName(type: PieceType, side?: Side): string {
  if (type === 'JOL' && side === 'HAN') return '병'
  return PIECE_KO[type]
}

export function sideKoreanName(side: Side): string {
  return side === 'CHO' ? '초' : '한'
}

/** "1·7" — 파일·랭크. rank 10 도 "5·10" 으로 명확. */
export function formatSquare(pos: Position): string {
  return `${pos.file}·${pos.rank}`
}

export const PASS_TEXT = '한 수 쉬기'

/** 스펙 표기: 출발좌표 기물명 도착좌표. 예) "1·7 졸 1·6" */
export function describeMove(move: Move): string {
  if (move.isPass || move.from === null || move.to === null || move.piece === null) {
    return PASS_TEXT
  }
  return `${formatSquare(move.from)} ${pieceKoreanName(move.piece.type, move.piece.side)} ${formatSquare(move.to)}`
}

/** 잡음 표시를 포함한 형태. 예) "1·7 졸 1·6 (병 잡음)" */
export function describeMoveWithCapture(move: Move): string {
  const base = describeMove(move)
  if (move.captured === null) return base
  return `${base} (${pieceKoreanName(move.captured.type, move.captured.side)} 잡음)`
}

/** 스크린리더/상세 설명용. 예) "초 졸, 1열 7행에서 1열 6행으로" */
export function describeMoveVerbose(move: Move): string {
  if (move.isPass || move.from === null || move.to === null || move.piece === null) {
    return PASS_TEXT
  }
  const p = move.piece
  const cap =
    move.captured === null
      ? ''
      : `, ${sideKoreanName(move.captured.side)} ${pieceKoreanName(move.captured.type, move.captured.side)} 잡음`
  return `${sideKoreanName(p.side)} ${pieceKoreanName(p.type, p.side)}, ${squareVerbose(move.from)}에서 ${squareVerbose(move.to)}(으)로${cap}`
}

export function squareVerbose(pos: Position): string {
  return `${pos.file}열 ${pos.rank}행`
}

export function pieceLabel(piece: Piece): string {
  return `${sideKoreanName(piece.side)} ${pieceKoreanName(piece.type, piece.side)}`
}

/** 번호가 붙은 기보 목록 문자열 배열. */
export function formatMoveList(moves: readonly Move[]): string[] {
  return moves.map((move, i) => `${i + 1}. ${describeMoveWithCapture(move)}`)
}
