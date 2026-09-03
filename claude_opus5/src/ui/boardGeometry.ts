/**
 * 보드 좌표 <-> SVG 좌표 변환. 규칙 지식은 없다.
 *
 * 장기 기물은 칸이 아니라 「선의 교차점」 위에 놓인다.
 * 따라서 격자는 9개의 세로선 × 10개의 가로선이고, 교차점은 90개다.
 *
 * MARGIN / CELL 비율은 터치 타깃 크기에 직접 영향을 준다.
 * viewBox 폭 대비 한 칸의 비율이 100/864 ≈ 11.6% 이므로,
 * 보드 폭이 380px 이상이면 교차점 간격이 44px 이상이 된다(P12 접근성 요구).
 */
import type { Position } from '../engine/types';

export const FILES = 9;
export const RANKS = 10;
export const CELL = 100;
export const MARGIN = 34;

export const GRID_W = (FILES - 1) * CELL;
export const GRID_H = (RANKS - 1) * CELL;
export const VIEW_W = GRID_W + MARGIN * 2;
export const VIEW_H = GRID_H + MARGIN * 2;

/** 기물 반지름. 교차점 간격(100)보다 작게 두어 인접 기물이 겹치지 않게 한다. */
export const PIECE_R = 42;
/** 클릭·터치 판정 반지름. 화면상 44px 이상을 확보하기 위해 한 칸을 꽉 채운다. */
export const HIT_R = 50;

export interface XY {
  readonly x: number;
  readonly y: number;
}

/** flipped 면 보드를 180도 돌린다(내 진영을 항상 아래로). */
export function toXY(p: Position, flipped: boolean): XY {
  const file = flipped ? FILES + 1 - p.file : p.file;
  const rank = flipped ? RANKS + 1 - p.rank : p.rank;
  return { x: MARGIN + (file - 1) * CELL, y: MARGIN + (rank - 1) * CELL };
}

/** SVG 좌표에서 가장 가까운 교차점. 너무 멀면 null. */
export function nearestPosition(xy: XY, flipped: boolean, maxDistance = CELL * 0.75): Position | null {
  const rawFile = Math.round((xy.x - MARGIN) / CELL) + 1;
  const rawRank = Math.round((xy.y - MARGIN) / CELL) + 1;
  if (rawFile < 1 || rawFile > FILES || rawRank < 1 || rawRank > RANKS) return null;

  const file = flipped ? FILES + 1 - rawFile : rawFile;
  const rank = flipped ? RANKS + 1 - rawRank : rawRank;
  const target = toXY({ file, rank }, flipped);
  const dist = Math.hypot(target.x - xy.x, target.y - xy.y);
  return dist <= maxDistance ? { file, rank } : null;
}

/** 화면(client) 좌표를 SVG 사용자 좌표로. */
export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): XY | null {
  const ctm = svg.getScreenCTM();
  if (ctm === null) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** 정팔각형 꼭짓점 목록 (한 진영 기물 형태 구분용). */
export function octagonPoints(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
