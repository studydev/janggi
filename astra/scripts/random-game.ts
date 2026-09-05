import { createInitialState, debugPrint } from '../src/engine/board'
import { validateRandomGames } from '../src/engine/validation'

const count = Number(process.argv[2] ?? 1000)
console.log(debugPrint(createInitialState()))
const started = performance.now()
const report = validateRandomGames(count)
console.log(JSON.stringify({ ...report, seconds: Number(((performance.now() - started) / 1000).toFixed(2)) }, null, 2))
if (report.violations.length || report.completedGames !== count) process.exitCode = 1