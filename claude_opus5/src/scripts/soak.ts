/**
 * 랜덤 대국 대량 실행 검증.
 *   npm run test:soak          # 1000판
 *   npx tsx src/scripts/soak.ts 200
 */
import { getGameResult } from '../engine/result';
import { playRandomGame, type Violation } from '../engine/selfplay';

const games = Number(process.argv[2] ?? 1000);
const t0 = Date.now();

const failures: { seed: number; violations: readonly Violation[] }[] = [];
const byReason = new Map<string, number>();
let totalPlies = 0;

for (let seed = 1; seed <= games; seed++) {
  const report = playRandomGame(seed, { validate: true });
  totalPlies += report.plies;
  byReason.set(report.result.reason, (byReason.get(report.result.reason) ?? 0) + 1);
  if (report.violations.length > 0) failures.push({ seed, violations: report.violations });

  // 종료 국면은 반드시 PLAYING 이 아니어야 한다.
  if (getGameResult(report.finalState).status === 'PLAYING') {
    failures.push({
      seed,
      violations: [{ kind: 'PIECE_COUNT', detail: '끝나지 않은 국면으로 종료했다', ply: report.plies }],
    });
  }

  if (seed % 100 === 0) {
    process.stdout.write(`  ${seed}/${games} 판 (${Date.now() - t0}ms)\n`);
  }
}

console.log('');
console.log(`총 ${games}판, 평균 ${(totalPlies / games).toFixed(1)}수, ${Date.now() - t0}ms`);
console.log('종료 사유:');
for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${reason.padEnd(12)} ${count}`);
}

if (failures.length > 0) {
  console.log(`\n규칙 위반 ${failures.length}건:`);
  for (const f of failures.slice(0, 20)) {
    for (const v of f.violations) {
      console.log(`  seed ${f.seed} [${v.ply}수] ${v.kind} — ${v.detail}`);
    }
  }
  process.exit(1);
}

console.log('\n규칙 위반 없음.');
