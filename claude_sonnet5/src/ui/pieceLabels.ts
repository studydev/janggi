/**
 * 기물 표시용 글리프 (UI 전용 — 규칙과 무관).
 * RULES.md P7 지정 문자셋: 車包馬象士卒兵將漢楚.
 */

import type { PieceType, Side } from '../engine/types'

const SHARED_HANJA: Record<Exclude<PieceType, 'GUNG' | 'JOL'>, string> = {
  CHA: '車',
  PO: '包',
  MA: '馬',
  SANG: '象',
  SA: '士',
}

const SHARED_HANGUL: Record<Exclude<PieceType, 'GUNG' | 'JOL'>, string> = {
  CHA: '차',
  PO: '포',
  MA: '마',
  SANG: '상',
  SA: '사',
}

export function pieceGlyph(side: Side, type: PieceType, script: 'hanja' | 'hangul'): string {
  if (type === 'GUNG') {
    if (script === 'hangul') return side === 'CHO' ? '초' : '한'
    return side === 'CHO' ? '楚' : '漢'
  }
  if (type === 'JOL') {
    if (script === 'hangul') return side === 'CHO' ? '졸' : '병'
    return side === 'CHO' ? '卒' : '兵'
  }
  return script === 'hangul' ? SHARED_HANGUL[type] : SHARED_HANJA[type]
}

/** 시각적 크기 등급 (형태로도 진영/기물을 구분 — 색맹 대응). */
export function pieceScale(type: PieceType): number {
  switch (type) {
    case 'GUNG':
      return 1.0
    case 'CHA':
    case 'PO':
      return 0.98
    case 'MA':
    case 'SANG':
    case 'SA':
      return 0.86
    case 'JOL':
      return 0.74
  }
}

export interface SidePalette {
  fill: string
  ring: string
  text: string
}

export function palette(side: Side, colorblind: boolean): SidePalette {
  if (colorblind) {
    return side === 'CHO'
      ? { fill: '#e8f0fb', ring: '#0b6bcb', text: '#08316a' } // 파랑 계열
      : { fill: '#fdece0', ring: '#c4471c', text: '#7a2a0d' } // 주황 계열
  }
  return side === 'CHO'
    ? { fill: '#e6f3ea', ring: '#1f7a41', text: '#0f3d20' } // 초록
    : { fill: '#fbe9e7', ring: '#b32424', text: '#5f1414' } // 빨강
}

export function sideLabel(side: Side): string {
  return side === 'CHO' ? '초' : '한'
}
