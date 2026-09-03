import { describe, expect, it } from 'vitest'
import { createInitialGameState, generateLegalMoves, makeMove } from '../rules'
import { boardKey } from '../board'
import { deserializeGame, serializeGame } from '../serialization'

describe('game record serialization', () => {
  it('round-trips a position and its move history', () => {
    const initial = createInitialGameState('SANG-MA-SANG-MA', 'MA-SANG-SANG-MA')
    const firstMove = generateLegalMoves(initial)[0]
    expect(firstMove).toBeDefined()
    const state = makeMove(initial, firstMove!)
    const restored = deserializeGame(serializeGame(state))
    expect(boardKey(restored.board)).toBe(boardKey(state.board))
    expect(restored.turn).toBe(state.turn)
    expect(restored.moveHistory).toHaveLength(1)
    expect(restored.moveHistory[0]?.to).toEqual(state.moveHistory[0]?.to)
  })

  it('rejects a record whose move is not legal in the saved position', () => {
    const payload = JSON.parse(serializeGame(createInitialGameState())) as { moveHistory: unknown[] }
    payload.moveHistory.push({ isPass: false, from: { file: 1, rank: 1 }, to: { file: 1, rank: 10 }, piece: { id: 'HAN-CHA-1', side: 'HAN', type: 'CHA' }, captured: null })
    expect(() => deserializeGame(JSON.stringify({ ...payload, version: 1, initialBoard: createInitialGameState().initialBoard, config: { bikjangEnabled: true, repetitionLimit: 3 } }))).toThrow()
  })
})