import { describe, expect, it } from 'vitest'
import { createEmptyBoard, withPiece } from '../board'
import type { Board, Position } from '../types'
import { generatePoMoves } from './po'

const hanPo = { side: 'HAN', type: 'PO' } as const
const hanJol = { side: 'HAN', type: 'JOL' } as const
const choJol = { side: 'CHO', type: 'JOL' } as const
const choPo = { side: 'CHO', type: 'PO' } as const

function moveKeys(board: Board, position: Position): string[] {
  return generatePoMoves(board, position)
    .map((move) => `${move.file},${move.rank}`)
    .sort()
}

describe('generatePoMoves', () => {
  it('cannot move without exactly one screen', () => {
    const board = withPiece(createEmptyBoard(), { file: 2, rank: 5 }, hanPo)

    expect(moveKeys(board, { file: 2, rank: 5 })).toHaveLength(0)
  })

  it('moves across open points after one non-cannon screen', () => {
    let board = withPiece(createEmptyBoard(), { file: 2, rank: 5 }, hanPo)
    board = withPiece(board, { file: 4, rank: 5 }, hanJol)

    expect(moveKeys(board, { file: 2, rank: 5 })).toEqual(
      expect.arrayContaining(['5,5', '6,5', '9,5']),
    )
  })

  it('can capture the first non-cannon enemy after one screen', () => {
    let board = withPiece(createEmptyBoard(), { file: 2, rank: 5 }, hanPo)
    board = withPiece(board, { file: 4, rank: 5 }, hanJol)
    board = withPiece(board, { file: 7, rank: 5 }, choJol)

    expect(moveKeys(board, { file: 2, rank: 5 })).toContain('7,5')
    expect(moveKeys(board, { file: 2, rank: 5 })).not.toContain('8,5')
  })

  it('cannot jump over a cannon', () => {
    let board = withPiece(createEmptyBoard(), { file: 2, rank: 5 }, hanPo)
    board = withPiece(board, { file: 4, rank: 5 }, choPo)

    expect(moveKeys(board, { file: 2, rank: 5 })).not.toContain('5,5')
  })

  it('cannot capture a cannon', () => {
    let board = withPiece(createEmptyBoard(), { file: 2, rank: 5 }, hanPo)
    board = withPiece(board, { file: 4, rank: 5 }, hanJol)
    board = withPiece(board, { file: 7, rank: 5 }, choPo)

    expect(moveKeys(board, { file: 2, rank: 5 })).not.toContain('7,5')
  })

  it('stops after a second intervening piece', () => {
    let board = withPiece(createEmptyBoard(), { file: 1, rank: 5 }, hanPo)
    board = withPiece(board, { file: 3, rank: 5 }, hanJol)
    board = withPiece(board, { file: 5, rank: 5 }, hanJol)

    expect(moveKeys(board, { file: 1, rank: 5 })).toContain('4,5')
    expect(moveKeys(board, { file: 1, rank: 5 })).not.toContain('6,5')
  })
})
