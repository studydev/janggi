import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { exportGame, importGame, MAX_RECORD_BYTES, stateAtMove } from './game-record'
import { makeMove, pass } from './rules'

const initial = { hanSetup: 'MSSM', choSetup: 'SMMS' } as const
function sampleGame() {
  let game = createInitialState(initial.hanSetup, initial.choSetup)
  game = makeMove(game, { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } })
  game = makeMove(game, { from: { file: 1, rank: 4 }, to: { file: 1, rank: 5 } })
  game = makeMove(game, { from: { file: 1, rank: 6 }, to: { file: 1, rank: 5 } })
  return pass(game)
}

describe('game records', () => {
  it('round trips arrangements, captures, pass, config and elapsed time', () => {
    const game = sampleGame()
    const loaded = importGame(exportGame(game, initial, { elapsedMs: 12_500 }))
    expect(loaded.game).toEqual(game)
    expect(loaded.initial).toEqual(initial)
    expect(loaded.elapsedMs).toBe(12_500)
    expect(loaded.result.status).toBe('PLAYING')
  })
  it('restores resignation and agreed score endings through the engine', () => {
    const game = sampleGame()
    expect(importGame(exportGame(game, initial, { conclusion: 'RESIGNATION' })).result).toMatchObject({ status: 'RESIGNED', winner: 'HAN' })
    expect(importGame(exportGame(game, initial, { conclusion: 'AGREEMENT' })).result).toMatchObject({ status: 'DRAW_BY_SCORE', winner: 'CHO' })
  })
  it.each(['coordinate', 'piece', 'capture', 'backward', 'pass'])('rejects a tampered %s', (kind) => {
    const record = JSON.parse(exportGame(sampleGame(), initial))
    if (kind === 'coordinate') record.moves[0].to.file = 10
    if (kind === 'piece') record.moves[0].piece.type = 'CHA'
    if (kind === 'capture') record.moves[2].captured.type = 'PO'
    if (kind === 'backward') record.moves[0].to.rank = 8
    if (kind === 'pass') record.moves[3].from = { file: 1, rank: 1 }
    expect(() => importGame(JSON.stringify(record))).toThrow()
  })
  it('rejects moves after an engine ending', () => {
    let game = createInitialState()
    for (let count = 0; count < 4; count += 1) game = pass(game)
    const record = JSON.parse(exportGame(game, { hanSetup: 'MSMS', choSetup: 'MSMS' }))
    expect(importGame(JSON.stringify(record)).result.reason).toBe('REPETITION')
    record.moves.push(record.moves[0])
    expect(() => importGame(JSON.stringify(record))).toThrow()
  })
  it('rejects unsupported, malformed and oversized data', () => {
    expect(() => importGame('{}')).toThrow()
    expect(() => importGame('null')).toThrow()
    expect(() => importGame('{')).toThrow()
    expect(() => importGame(' '.repeat(MAX_RECORD_BYTES + 1))).toThrow()
    const record = JSON.parse(exportGame(sampleGame(), initial))
    record.version = 2
    expect(() => importGame(JSON.stringify(record))).toThrow()
    record.version = 1
    record.config.repetitionCount = 0
    expect(() => importGame(JSON.stringify(record))).toThrow()
  })
  it('replays every ply without changing the live game', () => {
    const game = sampleGame()
    expect(stateAtMove(game, 0)).toEqual(createInitialState(initial.hanSetup, initial.choSetup))
    expect(stateAtMove(game, 2).capturedPieces).toHaveLength(0)
    expect(stateAtMove(game, 3).capturedPieces).toHaveLength(1)
    expect(stateAtMove(game, 4)).toBe(game)
    expect(game.moveHistory).toHaveLength(4)
    expect(() => stateAtMove(game, 5)).toThrow()
  })
})