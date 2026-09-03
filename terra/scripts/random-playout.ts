/**
 * Console playout — proves the pure engine can run a full game with no UI.
 *
 *   npm run play            # random seed
 *   npm run play -- 42      # fixed seed
 *   npm run play -- 42 120  # fixed seed, 120-ply cap
 *
 * Uses only src/engine (rules) and src/game/janggi-notation (display text).
 */
import { boardToText } from '../src/engine/board'
import { playRandomGame } from '../src/engine/playout'
import { calculateScore } from '../src/engine/result'
import { verifyPlayout } from '../src/engine/verification'
import { formatMove, sideName } from '../src/game/janggi-notation'

const [seedArg, maxPliesArg] = process.argv.slice(2)
const seed = Number.isFinite(Number(seedArg)) && seedArg !== undefined ? Number(seedArg) : (Math.random() * 2 ** 32) >>> 0
const maxPlies = Number.isFinite(Number(maxPliesArg)) && maxPliesArg !== undefined ? Number(maxPliesArg) : 400

console.log(`장기 무작위 대국 — seed ${seed}, 최대 ${maxPlies}수\n`)

const playout = playRandomGame(seed, maxPlies)

playout.steps.forEach((step) => {
  const label = step.move === null ? '한 수 쉬기' : formatMove(step.move)
  const captured = step.move?.captured ? '  (잡음)' : ''
  console.log(`${String(step.ply).padStart(3, ' ')}. ${sideName(step.side)}  ${label}${captured}`)
})

console.log('\n최종 국면\n')
console.log(boardToText(playout.state.board))

const { result } = playout
const winner = result.winner === null ? '없음' : sideName(result.winner)
console.log('')
console.log(`종료: ${playout.end}${result.reason ? ` — ${result.reason}` : ''}`)
console.log(`승자: ${winner}`)
console.log(`총 ${playout.plies}수`)
console.log(
  `점수  초 ${calculateScore(playout.state, 'CHO').toFixed(1)}  ·  한 ${calculateScore(playout.state, 'HAN').toFixed(1)}`,
)

verifyPlayout(seed, maxPlies)
console.log('\n불변식 검증 통과 (기물 규칙 · 궁성 이탈 · 포 규칙 · 기보 재생 일치).')
