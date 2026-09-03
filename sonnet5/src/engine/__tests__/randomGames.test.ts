// 랜덤 대국 자동 실행을 통한 엔진 불변식 검증 (RULES.md 위반 시 실패).
import { describe, expect, it } from 'vitest'
import { ALL_JIN_SETUPS, createInitialGameState, isInPalace, pieceAt } from '../board'
import { canPass, generateLegalMoves, makeMove, pass } from '../rules'
import { getGameResult } from '../result'
import type { GameState, JinSetup, Move } from '../types'

/** 결정적 테스트를 위한 시드 기반 PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 스펙은 1000판을 제안하지만, generateLegalMoves가 매 수마다 전체 국면을 재검증하는 비용 때문에
// 테스트 스위트 실행 시간을 고려해 기본값을 낮췄다. 필요하면 늘려서 더 오래 돌릴 수 있다.
const RANDOM_GAME_COUNT = 150
const MAX_PLIES_PER_GAME = 120

function pickJinSetup(rng: () => number): JinSetup {
  return ALL_JIN_SETUPS[Math.floor(rng() * ALL_JIN_SETUPS.length)]
}

function playOneRandomGame(rng: () => number): { history: GameState[]; moves: Move[] } {
  let state = createInitialGameState(pickJinSetup(rng), pickJinSetup(rng))
  const history: GameState[] = [state]
  const moves: Move[] = []

  for (let ply = 0; ply < MAX_PLIES_PER_GAME; ply++) {
    if (getGameResult(state).status !== 'PLAYING') break
    const legal = generateLegalMoves(state)
    const options: Array<() => GameState> = legal.map((m) => () => makeMove(state, m))
    const allowPass = canPass(state)
    if (allowPass) options.push(() => pass(state))
    if (options.length === 0) break // 이 시점엔 이미 getGameResult가 CHECKMATE를 보고했어야 한다

    const choiceIndex = Math.floor(rng() * options.length)
    if (choiceIndex < legal.length) moves.push(legal[choiceIndex])
    state = options[choiceIndex]()
    history.push(state)
  }

  return { history, moves }
}

describe(`랜덤 대국 ${RANDOM_GAME_COUNT}판 불변식 검증`, () => {
  const rng = mulberry32(20260903)

  for (let game = 0; game < RANDOM_GAME_COUNT; game++) {
    it(`게임 #${game + 1}: 규칙 위반이 발생하지 않는다`, () => {
      const { history, moves } = playOneRandomGame(rng)

      for (const state of history) {
        // 궁은 절대 잡히지 않아야 한다(체크메이트가 항상 실제 포획보다 먼저 게임을 끝낸다)
        expect(state.capturedPieces.HAN.some((p) => p.type === 'GUNG')).toBe(false)
        expect(state.capturedPieces.CHO.some((p) => p.type === 'GUNG')).toBe(false)

        // 사/궁은 항상 자기 궁성 안에 있어야 한다
        for (let file = 1; file <= 9; file++) {
          for (let rank = 1; rank <= 10; rank++) {
            const piece = pieceAt(state.board, { file, rank })
            if (piece && (piece.type === 'GUNG' || piece.type === 'SA')) {
              expect(isInPalace({ file, rank }, piece.side)).toBe(true)
            }
          }
        }
      }

      for (const move of moves) {
        // 포는 포를 잡을 수 없다
        if (move.piece.type === 'PO' && move.captured) {
          expect(move.captured.type).not.toBe('PO')
        }
        // 졸/병은 뒤로 이동하지 않는다
        if (move.piece.type === 'JOL') {
          const fwd = move.piece.side === 'HAN' ? 1 : -1
          expect((move.to.rank - move.from.rank) * fwd).toBeGreaterThanOrEqual(0)
        }
        // 기물은 항상 보드 안에 있어야 한다
        expect(move.to.file).toBeGreaterThanOrEqual(1)
        expect(move.to.file).toBeLessThanOrEqual(9)
        expect(move.to.rank).toBeGreaterThanOrEqual(1)
        expect(move.to.rank).toBeLessThanOrEqual(10)
      }
    })
  }
})
