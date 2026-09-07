import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  createPiece,
  positionToIndex,
} from '../board'
import type { PieceType, Position, Side } from '../types'
import {
  generateChaMoves,
  generateGungMoves,
  generateJolMoves,
  generateMaMoves,
  generatePoMoves,
  generateSaMoves,
  generateSangMoves,
} from './index'

function boardWith(entries: Array<[Position, Side, PieceType]>) {
  const board = createEmptyBoard()
  entries.forEach(([position, side, type], index) => {
    board[positionToIndex(position)] = createPiece(side, type, `test-${index}`)
  })
  return board
}

function contains(moves: Position[], file: number, rank: number): boolean {
  return moves.some((move) => move.file === file && move.rank === rank)
}

describe('차', () => {
  it('slides along all orthogonal lines from an empty-board center', () => {
    const board = boardWith([[{ file: 5, rank: 5 }, 'CHO', 'CHA']])
    expect(generateChaMoves(board, { file: 5, rank: 5 })).toHaveLength(17)
  })

  it('stops before an ally and includes an enemy capture', () => {
    const board = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'CHA'],
      [{ file: 5, rank: 3 }, 'CHO', 'JOL'],
      [{ file: 8, rank: 5 }, 'HAN', 'MA'],
    ])
    const moves = generateChaMoves(board, { file: 5, rank: 5 })
    expect(contains(moves, 5, 4)).toBe(true)
    expect(contains(moves, 5, 3)).toBe(false)
    expect(contains(moves, 8, 5)).toBe(true)
    expect(contains(moves, 9, 5)).toBe(false)
  })

  it('crosses a palace diagonal through its center unless blocked', () => {
    const open = boardWith([[{ file: 4, rank: 1 }, 'HAN', 'CHA']])
    expect(contains(generateChaMoves(open, { file: 4, rank: 1 }), 6, 3)).toBe(true)

    const blocked = boardWith([
      [{ file: 4, rank: 1 }, 'HAN', 'CHA'],
      [{ file: 5, rank: 2 }, 'HAN', 'SA'],
    ])
    expect(contains(generateChaMoves(blocked, { file: 4, rank: 1 }), 6, 3)).toBe(false)
  })
})

describe('포', () => {
  it('cannot move without exactly one screen', () => {
    const board = boardWith([[{ file: 5, rank: 5 }, 'CHO', 'PO']])
    expect(generatePoMoves(board, { file: 5, rank: 5 })).toEqual([])
  })

  it('moves beyond one screen and may capture the first enemy', () => {
    const board = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'PO'],
      [{ file: 5, rank: 4 }, 'CHO', 'JOL'],
      [{ file: 5, rank: 2 }, 'HAN', 'CHA'],
    ])
    const moves = generatePoMoves(board, { file: 5, rank: 5 })
    expect(contains(moves, 5, 3)).toBe(true)
    expect(contains(moves, 5, 2)).toBe(true)
    expect(contains(moves, 5, 1)).toBe(false)
  })

  it('cannot use a cannon as a screen or capture a cannon', () => {
    const cannonScreen = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'PO'],
      [{ file: 5, rank: 4 }, 'HAN', 'PO'],
    ])
    expect(generatePoMoves(cannonScreen, { file: 5, rank: 5 })).toEqual([])

    const cannonTarget = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'PO'],
      [{ file: 5, rank: 4 }, 'HAN', 'JOL'],
      [{ file: 5, rank: 2 }, 'HAN', 'PO'],
    ])
    const moves = generatePoMoves(cannonTarget, { file: 5, rank: 5 })
    expect(contains(moves, 5, 3)).toBe(true)
    expect(contains(moves, 5, 2)).toBe(false)
  })

  it('cannot continue after a second screen and supports palace diagonals', () => {
    const twoScreens = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'PO'],
      [{ file: 5, rank: 4 }, 'HAN', 'JOL'],
      [{ file: 5, rank: 2 }, 'CHO', 'MA'],
    ])
    expect(contains(generatePoMoves(twoScreens, { file: 5, rank: 5 }), 5, 1)).toBe(false)

    const palace = boardWith([
      [{ file: 4, rank: 1 }, 'HAN', 'PO'],
      [{ file: 5, rank: 2 }, 'CHO', 'JOL'],
    ])
    expect(contains(generatePoMoves(palace, { file: 4, rank: 1 }), 6, 3)).toBe(true)
  })
})

describe('마와 상', () => {
  it('blocks both horse destinations behind an occupied first leg', () => {
    const open = boardWith([[{ file: 5, rank: 5 }, 'CHO', 'MA']])
    expect(generateMaMoves(open, { file: 5, rank: 5 })).toHaveLength(8)

    const blocked = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'MA'],
      [{ file: 5, rank: 4 }, 'HAN', 'JOL'],
    ])
    const moves = generateMaMoves(blocked, { file: 5, rank: 5 })
    expect(moves).toHaveLength(6)
    expect(contains(moves, 4, 3)).toBe(false)
    expect(contains(moves, 6, 3)).toBe(false)
  })

  it('moves an elephant one straight plus two diagonal steps', () => {
    const board = boardWith([[{ file: 5, rank: 5 }, 'CHO', 'SANG']])
    expect(generateSangMoves(board, { file: 5, rank: 5 })).toHaveLength(8)
    expect(contains(generateSangMoves(board, { file: 5, rank: 5 }), 3, 2)).toBe(true)
  })

  it('blocks an elephant at either intermediate point', () => {
    const firstBlocked = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'SANG'],
      [{ file: 5, rank: 4 }, 'HAN', 'JOL'],
    ])
    expect(contains(generateSangMoves(firstBlocked, { file: 5, rank: 5 }), 3, 2)).toBe(false)

    const secondBlocked = boardWith([
      [{ file: 5, rank: 5 }, 'CHO', 'SANG'],
      [{ file: 4, rank: 3 }, 'HAN', 'JOL'],
    ])
    expect(contains(generateSangMoves(secondBlocked, { file: 5, rank: 5 }), 3, 2)).toBe(false)
  })
})

describe('궁과 사', () => {
  it('keeps the general inside its own palace and follows diagonal lines', () => {
    const center = boardWith([[{ file: 5, rank: 2 }, 'HAN', 'GUNG']])
    expect(generateGungMoves(center, { file: 5, rank: 2 })).toHaveLength(8)

    const edge = boardWith([[{ file: 4, rank: 2 }, 'HAN', 'GUNG']])
    expect(generateGungMoves(edge, { file: 4, rank: 2 })).toHaveLength(3)
    expect(contains(generateGungMoves(edge, { file: 4, rank: 2 }), 5, 3)).toBe(false)
  })

  it('uses the same palace graph for guards', () => {
    const board = boardWith([[{ file: 4, rank: 1 }, 'HAN', 'SA']])
    const moves = generateSaMoves(board, { file: 4, rank: 1 })
    expect(moves).toHaveLength(3)
    expect(contains(moves, 5, 2)).toBe(true)
  })
})

describe('졸과 병', () => {
  it('moves forward or sideways from the start but never backward', () => {
    const board = boardWith([[{ file: 5, rank: 5 }, 'CHO', 'JOL']])
    const moves = generateJolMoves(board, { file: 5, rank: 5 })
    expect(moves).toHaveLength(3)
    expect(contains(moves, 5, 4)).toBe(true)
    expect(contains(moves, 5, 6)).toBe(false)
  })

  it('moves diagonally forward only along the enemy palace lines', () => {
    const board = boardWith([[{ file: 5, rank: 2 }, 'CHO', 'JOL']])
    const moves = generateJolMoves(board, { file: 5, rank: 2 })
    expect(contains(moves, 4, 1)).toBe(true)
    expect(contains(moves, 6, 1)).toBe(true)
    expect(contains(moves, 4, 3)).toBe(false)
  })
})