import { describe, expect, it } from 'vitest'
import { createEmptyBoard, withPiece } from '../board'
import type { Board, Position } from '../types'
import { generateJolMoves } from './jol'

const hanJol = { side: 'HAN', type: 'JOL' } as const
const choJol = { side: 'CHO', type: 'JOL' } as const

function moveKeys(board: Board, position: Position): string[] {
  return generateJolMoves(board, position)
    .map((move) => `${move.file},${move.rank}`)
    .sort()
}

describe('generateJolMoves', () => {
  it('moves forward and sideways, never backward', () => {
    const board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).toEqual(['4,5', '5,6', '6,5'])
    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('5,4')
  })

  it('uses the opposite forward direction for Cho', () => {
    const board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, choJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).toContain('5,4')
    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('5,6')
  })

  it('can move diagonally forward on an opponent palace diagonal', () => {
    const board = withPiece(createEmptyBoard(), { file: 4, rank: 8 }, hanJol)

    expect(moveKeys(board, { file: 4, rank: 8 })).toContain('5,9')
  })

  it('does not use palace diagonals inside its own palace', () => {
    const board = withPiece(createEmptyBoard(), { file: 4, rank: 1 }, hanJol)

    expect(moveKeys(board, { file: 4, rank: 1 })).not.toContain('5,2')
  })
})
