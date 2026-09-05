import { pieceAt } from '../board';
import type { Board, Position } from '../types';
import { generateChaMoves } from './cha';
import { generatePoMoves } from './po';
import { generateMaMoves } from './ma';
import { generateSangMoves } from './sang';
import { generateGungMoves } from './gung';
import { generateSaMoves } from './sa';
import { generateJolMoves } from './jol';

export { generateChaMoves, generatePoMoves, generateMaMoves, generateSangMoves, generateGungMoves, generateSaMoves, generateJolMoves };
const GENERATORS = {
  CHA: generateChaMoves, PO: generatePoMoves, MA: generateMaMoves,
  SANG: generateSangMoves, GUNG: generateGungMoves, SA: generateSaMoves, JOL: generateJolMoves,
};
export function generatePseudoLegalMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos);
  return piece ? GENERATORS[piece.type](board, pos) : [];
}
