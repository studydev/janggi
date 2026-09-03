/**
 * npm run verify — perft 기준값 출력 + 랜덤 대국 1000판 불변식 검사.
 */

import { createInitialState } from '../src/engine/board'
import { perft } from '../src/engine/perft'
import { runRandomSuite } from '../src/engine/verification'

console.log('=== perft (초기 국면) ===')
const t0 = performance.now()
for (let depth = 1; depth <= 3; depth += 1) {
  const nodes = perft(createInitialState(), depth)
  console.log(`  perft(${depth}) = ${nodes}`)
}
console.log(`  (${((performance.now() - t0) / 1000).toFixed(1)}s)\n`)

console.log('=== 랜덤 대국 1000판 ===')
const t1 = performance.now()
const suite = runRandomSuite(1000)
console.log(`  평균 수: ${suite.avgMoves.toFixed(1)}`)
console.log(`  종료 사유:`, suite.endedByStatus)
console.log(`  위반 게임: ${suite.failures.length}`)
console.log(`  (${((performance.now() - t1) / 1000).toFixed(1)}s)`)

if (suite.failures.length > 0) {
  for (const f of suite.failures.slice(0, 10)) {
    console.log(`\n  seed ${f.seed} (${f.moves}수):`)
    for (const v of f.violations) console.log(`    - ${v.kind}: ${v.detail}`)
  }
  process.exit(1)
}
console.log('\n✅ 위반 없음')
