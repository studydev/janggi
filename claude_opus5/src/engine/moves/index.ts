/**
 * 기물별 의사이동(pseudo-legal move) 생성기의 단일 진입점.
 *
 * 「의사이동」 = 기물 고유 규칙만 만족하는 수. 자기 궁이 장군에 노출되는지는 보지 않는다.
 * 그 필터는 rules.ts 가 담당한다.
 */
import { onSamePalaceDiagonal, pieceAt } from '../board';
import type { Board, PieceType, Position } from '../types';
import { generateChaMoves } from './cha';
import { generateGungMoves, generateSaMoves } from './gung';
import { generateJolMoves } from './jol';
import { generateMaMoves } from './ma';
import { generatePoMoves } from './po';
import { generateSangMoves } from './sang';

export { generateChaMoves } from './cha';
export { generateGungMoves, generateSaMoves } from './gung';
export { generateJolMoves } from './jol';
export { generateMaMoves } from './ma';
export { generatePoMoves } from './po';
export { generateSangMoves } from './sang';
export { orthogonalRay, palaceDiagonalRay, raysFrom } from './rays';

type Generator = (board: Board, from: Position) => Position[];

const GENERATORS: Readonly<Record<PieceType, Generator>> = {
  CHA: generateChaMoves,
  PO: generatePoMoves,
  MA: generateMaMoves,
  SANG: generateSangMoves,
  GUNG: generateGungMoves,
  SA: generateSaMoves,
  JOL: generateJolMoves,
};

/** 해당 지점의 기물이 갈 수 있는 모든 지점(의사이동). 빈 지점이면 []. */
export function generatePseudoMovesFrom(board: Board, from: Position): Position[] {
  const piece = pieceAt(board, from);
  if (piece === null) return [];
  return GENERATORS[piece.type](board, from);
}

/**
 * 성능용 사전 필터. 「이 기물이 from 에서 to 를 노릴 가능성이 아예 없는가」만 판단한다.
 *
 * 반드시 실제 도달 가능한 조합을 하나도 배제하지 않는 안전한 상위집합이어야 한다.
 * 실제 합법 여부는 언제나 위의 생성기가 결정한다. 여기는 순수 최적화다.
 */
export function mayReach(type: PieceType, from: Position, to: Position): boolean {
  const df = Math.abs(to.file - from.file);
  const dr = Math.abs(to.rank - from.rank);

  switch (type) {
    case 'CHA':
    case 'PO':
      return df === 0 || dr === 0 || onSamePalaceDiagonal(from, to);
    case 'MA':
      return (df === 1 && dr === 2) || (df === 2 && dr === 1);
    case 'SANG':
      return (df === 2 && dr === 3) || (df === 3 && dr === 2);
    case 'GUNG':
    case 'SA':
      return df <= 1 && dr <= 1;
    case 'JOL':
      return df + dr === 1 || (df === 1 && dr === 1);
    default:
      return true;
  }
}
