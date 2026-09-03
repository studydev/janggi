// 좌표계, 궁성/대각선 판정, 초기 배치 생성 등 보드 관련 순수 유틸리티.
import { pieceLabel } from './pieceLabels'
import type { Board, GameConfig, GameState, JinSetup, Piece, PieceType, Position, Side } from './types'
import { DEFAULT_CONFIG } from './types'

export { DEFAULT_CONFIG }

export const FILES = 9
export const RANKS = 10

export function toIndex(pos: Position): number {
  return (pos.rank - 1) * FILES + (pos.file - 1)
}

export function toPosition(index: number): Position {
  return { file: (index % FILES) + 1, rank: Math.floor(index / FILES) + 1 }
}

export function isInBoard(pos: Position): boolean {
  return pos.file >= 1 && pos.file <= FILES && pos.rank >= 1 && pos.rank <= RANKS
}

export function opponent(side: Side): Side {
  return side === 'HAN' ? 'CHO' : 'HAN'
}

export function pieceAt(board: Board, pos: Position): Piece | null {
  if (!isInBoard(pos)) return null
  return board[toIndex(pos)]
}

export function samePosition(a: Position, b: Position): boolean {
  return a.file === b.file && a.rank === b.rank
}

interface PalaceDef {
  readonly side: Side
  readonly minRank: number
  readonly maxRank: number
}

const PALACES: readonly PalaceDef[] = [
  { side: 'HAN', minRank: 1, maxRank: 3 },
  { side: 'CHO', minRank: 8, maxRank: 10 },
]

/** side를 생략하면 양쪽 궁성 중 어디든 속하는지 검사한다. */
export function isInPalace(pos: Position, side?: Side): boolean {
  if (pos.file < 4 || pos.file > 6) return false
  return PALACES.some((p) => (side === undefined || p.side === side) && pos.rank >= p.minRank && pos.rank <= p.maxRank)
}

export function palaceOf(side: Side): PalaceDef {
  const palace = PALACES.find((p) => p.side === side)
  if (!palace) throw new Error(`Unknown side: ${side}`)
  return palace
}

/**
 * 궁성 대각선 위의 점(귀퉁이 4개 + 중앙 1개)에서, 그 점을 지나는 대각선을 따라
 * 이어지는 경로(들)를 가까운 점부터 순서대로 반환한다. 대각선 위가 아니면 빈 배열.
 * - 귀퉁이: 중앙을 거쳐 반대 귀퉁이까지 이어지는 경로 1개 (길이 2)
 * - 중앙: 네 귀퉁이 각각으로 이어지는 경로 4개 (길이 1)
 */
export function getPalaceDiagonalRays(pos: Position): Position[][] {
  const rays: Position[][] = []
  for (const palace of PALACES) {
    if (pos.file < 4 || pos.file > 6) continue
    if (pos.rank < palace.minRank || pos.rank > palace.maxRank) continue
    const top = palace.minRank
    const mid = palace.minRank + 1
    const bottom = palace.maxRank
    const corners: Position[] = [
      { file: 4, rank: top },
      { file: 6, rank: top },
      { file: 4, rank: bottom },
      { file: 6, rank: bottom },
    ]
    const center: Position = { file: 5, rank: mid }
    const isCenter = pos.file === 5 && pos.rank === mid
    if (isCenter) {
      for (const corner of corners) rays.push([corner])
      continue
    }
    const isCorner = corners.some((c) => c.file === pos.file && c.rank === pos.rank)
    if (!isCorner) continue
    const oppositeFile = pos.file === 4 ? 6 : 4
    const oppositeRank = pos.rank === top ? bottom : top
    rays.push([center, { file: oppositeFile, rank: oppositeRank }])
  }
  return rays
}

export function isOnPalaceDiagonal(pos: Position): boolean {
  return getPalaceDiagonalRays(pos).length > 0
}

/** 전진 방향 부호. HAN은 rank 증가 방향, CHO는 rank 감소 방향으로 전진한다. */
export function forwardDir(side: Side): 1 | -1 {
  return side === 'HAN' ? 1 : -1
}

interface JinLayout {
  readonly file2: 'MA' | 'SANG'
  readonly file3: 'MA' | 'SANG'
  readonly file7: 'MA' | 'SANG'
  readonly file8: 'MA' | 'SANG'
}

export function getJinLayout(setup: JinSetup): JinLayout {
  switch (setup) {
    case 'MSMS':
      return { file2: 'MA', file3: 'SANG', file7: 'MA', file8: 'SANG' }
    case 'SMSM':
      return { file2: 'SANG', file3: 'MA', file7: 'SANG', file8: 'MA' }
    case 'MSSM':
      return { file2: 'MA', file3: 'SANG', file7: 'SANG', file8: 'MA' }
    case 'SMMS':
      return { file2: 'SANG', file3: 'MA', file7: 'MA', file8: 'SANG' }
  }
}

export const ALL_JIN_SETUPS: readonly JinSetup[] = ['MSMS', 'SMSM', 'MSSM', 'SMMS']

export const JIN_SETUP_NAME_KO: Record<JinSetup, string> = {
  MSMS: '마상마상',
  SMSM: '상마상마',
  MSSM: '마상상마',
  SMMS: '상마마상',
}

export function createInitialBoard(hanSetup: JinSetup, choSetup: JinSetup): Board {
  const cells: (Piece | null)[] = new Array(FILES * RANKS).fill(null)
  const set = (file: number, rank: number, type: PieceType, side: Side): void => {
    cells[toIndex({ file, rank })] = { type, side }
  }

  const placeSide = (side: Side, backRank: number, gungRank: number, poRank: number, jolRank: number, jinSetup: JinSetup): void => {
    const layout = getJinLayout(jinSetup)
    set(1, backRank, 'CHA', side)
    set(9, backRank, 'CHA', side)
    set(2, backRank, layout.file2, side)
    set(3, backRank, layout.file3, side)
    set(7, backRank, layout.file7, side)
    set(8, backRank, layout.file8, side)
    set(4, backRank, 'SA', side)
    set(6, backRank, 'SA', side)
    set(5, gungRank, 'GUNG', side)
    set(2, poRank, 'PO', side)
    set(8, poRank, 'PO', side)
    for (const file of [1, 3, 5, 7, 9]) set(file, jolRank, 'JOL', side)
  }

  placeSide('HAN', 1, 2, 3, 4, hanSetup)
  placeSide('CHO', 10, 9, 8, 7, choSetup)

  return cells
}

const TYPE_CODE: Record<PieceType, string> = { GUNG: 'G', SA: 'A', CHA: 'C', PO: 'P', MA: 'M', SANG: 'X', JOL: 'J' }

/** 국면 반복 감지용 키. 보드 배치 + 차례를 하나의 문자열로 직렬화한다(표시용이 아닌 내부 식별용). */
export function positionKey(board: Board, turn: Side): string {
  let key: string = turn
  for (const cell of board) {
    key += cell ? `${cell.side}${TYPE_CODE[cell.type]}` : '.'
  }
  return key
}

export function createInitialGameState(hanSetup: JinSetup, choSetup: JinSetup, config: GameConfig = DEFAULT_CONFIG): GameState {
  const board = createInitialBoard(hanSetup, choSetup)
  const turn: Side = 'CHO'
  return {
    board,
    turn,
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config,
    positionCounts: { [positionKey(board, turn)]: 1 },
  }
}

/** 콘솔에 보드를 텍스트로 출력하기 위한 문자열 생성(디버그용). */
export function debugPrint(state: GameState): string {
  const lines: string[] = []
  lines.push(`  ${Array.from({ length: FILES }, (_, i) => ` ${i + 1} `).join('')}`)
  for (let rank = 1; rank <= RANKS; rank++) {
    const cells: string[] = []
    for (let file = 1; file <= FILES; file++) {
      const piece = pieceAt(state.board, { file, rank })
      if (!piece) {
        cells.push(' · ')
      } else {
        const label = pieceLabel(piece, 'HANJA')
        cells.push(piece.side === 'HAN' ? ` ${label} ` : `(${label})`)
      }
    }
    lines.push(`${rank.toString().padStart(2, ' ')}${cells.join('')}`)
  }
  lines.push(`차례: ${state.turn === 'HAN' ? '한(漢)' : '초(楚)'} / 수순: ${state.moveHistory.length}`)
  return lines.join('\n')
}
