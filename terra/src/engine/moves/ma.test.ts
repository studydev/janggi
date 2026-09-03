import { describe, expect, it } from 'vitest'
import { createEmptyBoard, withPiece } from '../board'
import type { Board, Position } from '../types'
import { generateMaMoves } from './ma'

const hanMa = { side: 'HAN', type: 'MA' } as const
const hanJol = { side: 'HAN', type: 'JOL' } as const
const choJol = { side: 'CHO', type: 'JOL' } as const

function moveKeys(board: Board, position: Position): string[] {
  return generateMaMoves(board, position)
    .map((move) => `${move.file},${move.rank}`)
    .sort()
}

describe('generateMaMoves', () => {
  it('has eight destinations from an open center', () => {
    const board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanMa)

    expect(moveKeys(board, { file: 5, rank: 5 })).toHaveLength(8)
  })

  it('removes both destinations behind a blocked leg', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanMa)
    board = withPiece(board, { file: 5, rank: 4 }, hanJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).not.toEqual(
      expect.arrayContaining(['4,3', '6,3']),
    )
  })

  it('can capture an enemy at an unblocked destination', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanMa)
    board = withPiece(board, { file: 4, rank: 3 }, choJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).toContain('4,3')
  })

  it('drops destinations that fall off the board from a corner', () => {
    const board = withPiece(createEmptyBoard(), { file: 1, rank: 1 }, hanMa)

    // Only the two knight jumps that stay on the board: (2,3) and (3,2).
    expect(moveKeys(board, { file: 1, rank: 1 })).toEqual(['2,3', '3,2'])
  })

  it('is not blocked by a piece sitting on the destination itself', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanMa)
    // Leg (5,4) is clear; a friendly piece on the landing point (4,3) still blocks.
    board = withPiece(board, { file: 4, rank: 3 }, hanJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('4,3')
    expect(moveKeys(board, { file: 5, rank: 5 })).toContain('6,3')
  })
})
