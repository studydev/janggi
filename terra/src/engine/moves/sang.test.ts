import { describe, expect, it } from 'vitest'
import { createEmptyBoard, withPiece } from '../board'
import type { Board, Position } from '../types'
import { generateSangMoves } from './sang'

const hanSang = { side: 'HAN', type: 'SANG' } as const
const hanJol = { side: 'HAN', type: 'JOL' } as const
const choJol = { side: 'CHO', type: 'JOL' } as const

function moveKeys(board: Board, position: Position): string[] {
  return generateSangMoves(board, position)
    .map((move) => `${move.file},${move.rank}`)
    .sort()
}

describe('generateSangMoves', () => {
  it('has eight destinations from an open center', () => {
    const board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanSang)

    expect(moveKeys(board, { file: 5, rank: 5 })).toHaveLength(8)
  })

  it('cannot pass through its first straight step', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanSang)
    board = withPiece(board, { file: 5, rank: 4 }, hanJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('3,2')
    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('7,2')
  })

  it('cannot pass through its second diagonal step', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanSang)
    board = withPiece(board, { file: 4, rank: 3 }, hanJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('3,2')
    expect(moveKeys(board, { file: 5, rank: 5 })).toContain('7,2')
  })

  it('can capture an enemy at an unblocked destination', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanSang)
    board = withPiece(board, { file: 3, rank: 2 }, choJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).toContain('3,2')
  })
})
