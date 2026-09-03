// 기물 종류별 의사이동(pseudo-legal move) 생성기 통합 진입점.
import { pieceAt } from '../board'
import type { Board, PieceType, Position } from '../types'
import { generateChaMoves } from './cha'
import { generateJolMoves } from './jol'
import { generateMaMoves } from './ma'
import { generateGungMoves, generateSaMoves } from './palace'
import { generatePoMoves } from './po'
import { generateSangMoves } from './sang'

type MoveGenerator = (board: Board, pos: Position) => Position[]

const GENERATORS: Record<PieceType, MoveGenerator> = {
  GUNG: generateGungMoves,
  SA: generateSaMoves,
  CHA: generateChaMoves,
  PO: generatePoMoves,
  MA: generateMaMoves,
  SANG: generateSangMoves,
  JOL: generateJolMoves,
}

/** 장군 여부를 고려하지 않은, 기물 자체의 이동 규칙만 반영한 의사이동 목록. */
export function generatePseudoMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  return GENERATORS[piece.type](board, pos)
}

export { generateChaMoves, generateGungMoves, generateJolMoves, generateMaMoves, generatePoMoves, generateSaMoves, generateSangMoves }
