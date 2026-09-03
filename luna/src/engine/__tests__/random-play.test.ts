import { describe, expect, it } from 'vitest'
import { getPiece, isInBoard, isInPalace, positionFromIndex } from '../board'
import { generateLegalMoves, isCheck, makeMove, pass, createInitialGameState } from '../rules'
import { getGameResult } from '../result'
import { HORSE_ELEPHANT_SETUP_OPTIONS, type Move, type Position } from '../types'

function nextRandom(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0
}

function assertMoveSafety(move: Move, board: ReturnType<typeof createInitialGameState>['board']): void {
  expect(isInBoard(move.from)).toBe(true)
  expect(isInBoard(move.to)).toBe(true)
  expect(move.captured?.type).not.toBe('GUNG')
  if (move.piece.type === 'JOL') {
    if (move.piece.side === 'HAN') expect(move.to.rank).toBeGreaterThanOrEqual(move.from.rank)
    else expect(move.to.rank).toBeLessThanOrEqual(move.from.rank)
  }
  if (move.piece.type === 'PO') {
    const fileStep = Math.sign(move.to.file - move.from.file)
    const rankStep = Math.sign(move.to.rank - move.from.rank)
    let current: Position = { file: move.from.file + fileStep, rank: move.from.rank + rankStep }
    let screens = 0
    while (current.file !== move.to.file || current.rank !== move.to.rank) {
      const piece = getPiece(board, current)
      if (piece !== null) {
        screens += 1
        expect(piece.type).not.toBe('PO')
      }
      current = { file: current.file + fileStep, rank: current.rank + rankStep }
    }
    expect(screens).toBe(1)
    expect(move.captured?.type).not.toBe('PO')
  }
}

function assertBoardSafety(state: ReturnType<typeof createInitialGameState>): void {
  expect(state.board).toHaveLength(90)
  state.board.forEach((piece, index) => {
    if (piece === null) return
    const position = positionFromIndex(index)
    expect(isInBoard(position)).toBe(true)
    if (piece.type === 'GUNG' || piece.type === 'SA') expect(isInPalace(position, piece.side)).toBe(true)
  })
}

describe('random engine safety', () => {
  it('survives 1000 deterministic random opening sequences without invariant violations', { timeout: 30000 }, () => {
    for (let gameNumber = 0; gameNumber < 1000; gameNumber += 1) {
      const hanSetup = HORSE_ELEPHANT_SETUP_OPTIONS[gameNumber % HORSE_ELEPHANT_SETUP_OPTIONS.length]
      const choSetup = HORSE_ELEPHANT_SETUP_OPTIONS[(gameNumber + 1) % HORSE_ELEPHANT_SETUP_OPTIONS.length]
      let state = createInitialGameState(hanSetup, choSetup)
      let seed = gameNumber + 1
      for (let ply = 0; ply < 4; ply += 1) {
        assertBoardSafety(state)
        const result = getGameResult(state)
        if (result.status !== 'PLAYING') {
          break
        }
        const legalMoves = generateLegalMoves(state)
        expect(legalMoves.every((move) => move.captured?.type !== 'GUNG')).toBe(true)
        if (legalMoves.length === 0) {
          expect(isCheck(state, state.turn)).toBe(false)
          state = pass(state)
          continue
        }
        seed = nextRandom(seed)
        const move = legalMoves[seed % legalMoves.length]
        assertMoveSafety(move, state.board)
        state = makeMove(state, move)
      }
    }
  })
})