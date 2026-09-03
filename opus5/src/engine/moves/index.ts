import { pieceAt, piecesOf } from '../board';
import type { Board, MoveInput, Position, Side } from '../types';
import { generateChaMoves } from './cha';
import { generateGungMoves, generatePalaceStepMoves, generateSaMoves } from './gung';
import { generateJolMoves } from './jol';
import { generateMaMoves } from './ma';
import { generatePoMoves } from './po';
import { generateSangMoves } from './sang';

export { generateChaMoves } from './cha';
export { generateGungMoves, generateSaMoves, generatePalaceStepMoves } from './gung';
export { generateJolMoves } from './jol';
export { generateMaMoves } from './ma';
export { generatePoMoves } from './po';
export { generateSangMoves } from './sang';

/**
 * 지정한 지점의 기물이 갈 수 있는 지점(의사이동). 장군 노출 여부는 여기서 따지지 않는다.
 */
export function generatePieceMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  if (!piece) return [];

  switch (piece.type) {
    case 'CHA':
      return generateChaMoves(board, pos);
    case 'PO':
      return generatePoMoves(board, pos);
    case 'MA':
      return generateMaMoves(board, pos);
    case 'SANG':
      return generateSangMoves(board, pos);
    case 'GUNG':
      return generateGungMoves(board, pos);
    case 'SA':
      return generateSaMoves(board, pos);
    case 'JOL':
      return generateJolMoves(board, pos);
    default:
      return generatePalaceStepMoves(board, pos);
  }
}

export function generateAllPseudoMoves(board: Board, side: Side): MoveInput[] {
  const moves: MoveInput[] = [];
  for (const { pos } of piecesOf(board, side)) {
    for (const to of generatePieceMoves(board, pos)) {
      moves.push({ from: pos, to });
    }
  }
  return moves;
}
