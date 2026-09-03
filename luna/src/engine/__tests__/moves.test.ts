import { describe, expect, it } from 'vitest'
import { emptyBoard, placePiece, createPiece } from '../board'
import { generateChaMoves, generateGungMoves, generateJolMoves, generateMaMoves, generatePoMoves, generateSaMoves, generateSangMoves } from '../moves'
import type { Board, PieceType, Position, Side } from '../types'

function boardWith(...pieces: Array<[Side, PieceType, Position]>): Board {
  let board = emptyBoard()
  pieces.forEach(([side, type, position], index) => {
    board = placePiece(board, position, createPiece(side, type, `${side}-${type}-${index}`))
  })
  return board
}

function hasMove(moves: Position[], file: number, rank: number): boolean {
  return moves.some((move) => move.file === file && move.rank === rank)
}

describe('cha moves', () => {
  it('moves to every open orthogonal point from the middle', () => {
    const moves = generateChaMoves(boardWith(['HAN', 'CHA', { file: 5, rank: 5 }]), { file: 5, rank: 5 })
    expect(moves).toHaveLength(17)
  })

  it('stops at an allied piece and may capture an enemy piece', () => {
    const blocked = boardWith(
      ['HAN', 'CHA', { file: 5, rank: 5 }],
      ['HAN', 'JOL', { file: 5, rank: 7 }],
      ['CHO', 'JOL', { file: 7, rank: 5 }],
    )
    const moves = generateChaMoves(blocked, { file: 5, rank: 5 })
    expect(hasMove(moves, 5, 6)).toBe(true)
    expect(hasMove(moves, 5, 7)).toBe(false)
    expect(hasMove(moves, 7, 5)).toBe(true)
    expect(hasMove(moves, 8, 5)).toBe(false)
  })

  it('follows a palace diagonal from corner through the center', () => {
    const moves = generateChaMoves(boardWith(['HAN', 'CHA', { file: 4, rank: 1 }]), { file: 4, rank: 1 })
    expect(hasMove(moves, 5, 2)).toBe(true)
    expect(hasMove(moves, 6, 3)).toBe(true)
  })

  it('stops a palace diagonal when the center is occupied', () => {
    const moves = generateChaMoves(
      boardWith(['HAN', 'CHA', { file: 4, rank: 1 }], ['HAN', 'JOL', { file: 5, rank: 2 }]),
      { file: 4, rank: 1 },
    )
    expect(hasMove(moves, 5, 2)).toBe(false)
    expect(hasMove(moves, 6, 3)).toBe(false)
  })
})

describe('po moves', () => {
  it('requires exactly one non-po screen and cannot capture a po', () => {
    const moves = generatePoMoves(
      boardWith(
        ['HAN', 'PO', { file: 2, rank: 5 }],
        ['HAN', 'JOL', { file: 4, rank: 5 }],
        ['CHO', 'JOL', { file: 6, rank: 5 }],
      ),
      { file: 2, rank: 5 },
    )
    expect(hasMove(moves, 5, 5)).toBe(true)
    expect(hasMove(moves, 6, 5)).toBe(true)
  })

  it('does not move without a screen, past two screens, or through a po', () => {
    const noScreen = generatePoMoves(boardWith(['HAN', 'PO', { file: 2, rank: 5 }]), { file: 2, rank: 5 })
    expect(noScreen).toHaveLength(0)

    const twoScreens = generatePoMoves(
      boardWith(
        ['HAN', 'PO', { file: 2, rank: 5 }],
        ['HAN', 'JOL', { file: 2, rank: 6 }],
        ['HAN', 'JOL', { file: 2, rank: 7 }],
        ['CHO', 'JOL', { file: 2, rank: 8 }],
      ),
      { file: 2, rank: 5 },
    )
    expect(hasMove(twoScreens, 2, 8)).toBe(false)

    const poScreen = generatePoMoves(
      boardWith(['HAN', 'PO', { file: 2, rank: 5 }], ['HAN', 'PO', { file: 2, rank: 6 }]),
      { file: 2, rank: 5 },
    )
    expect(poScreen).toHaveLength(0)
  })
})

describe('ma and sang movement', () => {
  it('blocks a horse when its first straight leg is occupied', () => {
    const moves = generateMaMoves(
      boardWith(['HAN', 'MA', { file: 5, rank: 5 }], ['HAN', 'JOL', { file: 5, rank: 6 }]),
      { file: 5, rank: 5 },
    )
    expect(hasMove(moves, 6, 7)).toBe(false)
    expect(moves).toHaveLength(6)
  })

  it('requires both intermediate points for an elephant', () => {
    const open = generateSangMoves(boardWith(['HAN', 'SANG', { file: 5, rank: 5 }]), { file: 5, rank: 5 })
    expect(hasMove(open, 7, 8)).toBe(true)
    const firstBlocked = generateSangMoves(
      boardWith(['HAN', 'SANG', { file: 5, rank: 5 }], ['HAN', 'JOL', { file: 5, rank: 6 }]),
      { file: 5, rank: 5 },
    )
    expect(hasMove(firstBlocked, 7, 8)).toBe(false)
    const secondBlocked = generateSangMoves(
      boardWith(['HAN', 'SANG', { file: 5, rank: 5 }], ['HAN', 'JOL', { file: 6, rank: 7 }]),
      { file: 5, rank: 5 },
    )
    expect(hasMove(secondBlocked, 7, 8)).toBe(false)
  })
})

describe('palace and pawn movement', () => {
  it('keeps king and guard inside the palace and allows palace diagonals', () => {
    const gungMoves = generateGungMoves(boardWith(['HAN', 'GUNG', { file: 5, rank: 2 }]), { file: 5, rank: 2 })
    const saMoves = generateSaMoves(boardWith(['HAN', 'SA', { file: 4, rank: 1 }]), { file: 4, rank: 1 })
    expect(hasMove(gungMoves, 4, 1)).toBe(true)
    expect(hasMove(gungMoves, 5, 3)).toBe(true)
    expect(hasMove(gungMoves, 5, 4)).toBe(false)
    expect(hasMove(saMoves, 5, 2)).toBe(true)
  })

  it('allows forward and sideways pawn moves but never backward', () => {
    const moves = generateJolMoves(boardWith(['HAN', 'JOL', { file: 5, rank: 5 }]), { file: 5, rank: 5 })
    expect(hasMove(moves, 5, 6)).toBe(true)
    expect(hasMove(moves, 4, 5)).toBe(true)
    expect(hasMove(moves, 6, 5)).toBe(true)
    expect(hasMove(moves, 5, 4)).toBe(false)
  })

  it('allows forward diagonals on the opponent palace lines', () => {
    const hanMoves = generateJolMoves(boardWith(['HAN', 'JOL', { file: 5, rank: 9 }]), { file: 5, rank: 9 })
    const choMoves = generateJolMoves(boardWith(['CHO', 'JOL', { file: 5, rank: 2 }]), { file: 5, rank: 2 })
    expect(hasMove(hanMoves, 4, 10)).toBe(true)
    expect(hasMove(choMoves, 4, 1)).toBe(true)
  })
})