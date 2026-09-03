import { describe, expect, it } from 'vitest'
import { createEmptyBoard, withPiece } from '../board'
import type { Board, Position } from '../types'
import { generateGungMoves, generateSaMoves } from './gung'

const hanGung = { side: 'HAN', type: 'GUNG' } as const
const hanSa = { side: 'HAN', type: 'SA' } as const

function moveKeys(generator: (board: Board, position: Position) => Position[], board: Board, position: Position): string[] {
  return generator(board, position)
    .map((move) => `${move.file},${move.rank}`)
    .sort()
}

describe('generateGungMoves', () => {
  it('moves one point along palace lines including center diagonals', () => {
    const board = withPiece(createEmptyBoard(), { file: 5, rank: 2 }, hanGung)

    expect(moveKeys(generateGungMoves, board, { file: 5, rank: 2 })).toHaveLength(8)
  })

  it('does not leave the palace', () => {
    const board = withPiece(createEmptyBoard(), { file: 4, rank: 1 }, hanGung)

    expect(moveKeys(generateGungMoves, board, { file: 4, rank: 1 })).not.toEqual(
      expect.arrayContaining(['3,1', '4,0']),
    )
  })
})

describe('generateSaMoves', () => {
  it('uses the same palace diagonal restriction as the general', () => {
    const board = withPiece(createEmptyBoard(), { file: 4, rank: 1 }, hanSa)

    expect(moveKeys(generateSaMoves, board, { file: 4, rank: 1 })).toContain('5,2')
    expect(moveKeys(generateSaMoves, board, { file: 4, rank: 1 })).not.toContain('3,1')
  })
})
