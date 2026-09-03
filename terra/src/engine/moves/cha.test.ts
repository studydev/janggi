import { describe, expect, it } from 'vitest'
import { createEmptyBoard, withPiece } from '../board'
import type { Board, Position } from '../types'
import { generateChaMoves } from './cha'

const hanCha = { side: 'HAN', type: 'CHA' } as const
const hanJol = { side: 'HAN', type: 'JOL' } as const
const choJol = { side: 'CHO', type: 'JOL' } as const

function moveKeys(board: Board, position: Position): string[] {
  return generateChaMoves(board, position)
    .map((move) => `${move.file},${move.rank}`)
    .sort()
}

describe('generateChaMoves', () => {
  it('moves across every open horizontal and vertical line', () => {
    const board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanCha)

    expect(moveKeys(board, { file: 5, rank: 5 })).toHaveLength(17)
  })

  it('stops before a friendly piece', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanCha)
    board = withPiece(board, { file: 5, rank: 7 }, hanJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('5,7')
    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('5,8')
  })

  it('includes an enemy piece and stops beyond it', () => {
    let board = withPiece(createEmptyBoard(), { file: 5, rank: 5 }, hanCha)
    board = withPiece(board, { file: 5, rank: 7 }, choJol)

    expect(moveKeys(board, { file: 5, rank: 5 })).toContain('5,7')
    expect(moveKeys(board, { file: 5, rank: 5 })).not.toContain('5,8')
  })

  it('follows a palace diagonal through its center', () => {
    const board = withPiece(createEmptyBoard(), { file: 4, rank: 1 }, hanCha)

    expect(moveKeys(board, { file: 4, rank: 1 })).toEqual(
      expect.arrayContaining(['5,2', '6,3']),
    )
  })

  it('stops on a palace diagonal at an occupied center', () => {
    let board = withPiece(createEmptyBoard(), { file: 4, rank: 1 }, hanCha)
    board = withPiece(board, { file: 5, rank: 2 }, hanJol)

    expect(moveKeys(board, { file: 4, rank: 1 })).not.toContain('5,2')
    expect(moveKeys(board, { file: 4, rank: 1 })).not.toContain('6,3')
  })
})
