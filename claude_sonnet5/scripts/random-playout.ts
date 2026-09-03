/**
 * npm run play — 엔진만으로 콘솔에서 랜덤 대국을 완주시킨다.
 *
 * UI 없이 규칙 엔진이 대국을 끝까지 진행할 수 있는지 확인하는 용도.
 */

import { createInitialState, debugPrint } from '../src/engine/board'
import { describeMove } from '../src/game/janggi-notation'
import { getGameResult } from '../src/engine/result'
import { applyMove, generateLegalMoves, isCheck } from '../src/engine/rules'
import { makeRng } from '../src/engine/verification'
import type { Move } from '../src/engine/types'

const seed = Number(process.argv[2]) || Math.floor(Math.random() * 1e9)
const rng = makeRng(seed)
const PASS: Move = { from: null, to: null, piece: null, captured: null, isPass: true }

let state = createInitialState()
let ply = 0
const maxPly = 600

console.log(`seed = ${seed}\n`)

for (; ply < maxPly; ply += 1) {
  const result = getGameResult(state)
  if (result.status !== 'PLAYING') {
    console.log(`\n=== 대국 종료 (${ply}수) ===`)
    console.log(`상태: ${result.status}`)
    console.log(`사유: ${result.reason}`)
    console.log(`승자: ${result.winner ?? '무승부'}`)
    console.log(`점수: 초 ${result.scores.CHO} / 한 ${result.scores.HAN}`)
    debugPrint(state)
    process.exit(0)
  }

  const legal = generateLegalMoves(state)
  if (legal.length === 0) {
    if (isCheck(state.board, state.turn)) {
      console.log(`\n외통인데 getGameResult 가 놓침 — turn ${state.turn}`)
      process.exit(1)
    }
    console.log(`${ply + 1}. ${state.turn} 한 수 쉬기`)
    state = applyMove(state, PASS)
    continue
  }

  const move = legal[Math.floor(rng() * legal.length)]
  console.log(`${ply + 1}. ${state.turn}  ${describeMove(move)}`)
  state = applyMove(state, move)
}

console.log(`\n${maxPly}수까지 종료 조건 없음 (무승부성 대치일 수 있음).`)
const r = getGameResult(state)
console.log(`점수: 초 ${r.scores.CHO} / 한 ${r.scores.HAN}`)
debugPrint(state)
