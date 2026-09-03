/**
 * 엔진 회귀 검증: perft 기준값 + 랜덤 대국 대량 실행.
 *   npm run verify -- --games 1000 --depth 3
 */
import { perft } from '../src/engine/perft';
import { createGame } from '../src/engine/rules';
import { runRandomGames } from '../src/engine/verification';

function arg(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

const depth = arg('depth', 3);
const games = arg('games', 1000);

const initial = createGame();
console.log('== perft (초기 국면, 마상마상/마상마상) ==');
for (let d = 1; d <= depth; d += 1) {
  const start = Date.now();
  const nodes = perft(initial, d);
  console.log(`depth ${d}: ${nodes} nodes (${Date.now() - start}ms)`);
}

console.log(`\n== 랜덤 대국 ${games}판 ==`);
const start = Date.now();
const stats = runRandomGames({ games, maxPlies: 300, seed: 20260903, undoChecks: 2 });
console.log(`총 ${stats.totalPlies}수 / ${Date.now() - start}ms`);
console.log('종료 사유:', stats.results);

if (stats.violations.length > 0) {
  console.error(`\n규칙 위반 ${stats.violations.length}건`);
  for (const violation of stats.violations.slice(0, 20)) {
    console.error(`  game ${violation.game} ply ${violation.ply} [${violation.kind}] ${violation.detail}`);
  }
  process.exit(1);
}

console.log('규칙 위반 없음.');
