import { validateRandomGames } from '../src/engine/validation'

const games = Number.parseInt(process.argv[2] ?? '1000', 10)
const report = validateRandomGames(games)

console.log(JSON.stringify(report, null, 2))
if (report.violations.length > 0) process.exitCode = 1