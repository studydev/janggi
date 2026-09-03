// luna 와 terra 엔진의 초기 국면 perft(3)이 다른 원인을 좁히기 위한 분할 perft 비교
// (luna 30661 vs 나머지 다수 30506)
import { createInitialGameState, generateLegalMoves as lunaLegal, makeMove as lunaMake } from '../../luna/src/engine/rules';
import { createInitialState } from '../../terra/src/engine/board';
import { generateLegalMoves as terraLegal, applyLegalMove } from '../../terra/src/engine/rules';

const key = (m: { from: { file: number; rank: number }; to: { file: number; rank: number } }) =>
  `${m.from.file}${m.from.rank}->${m.to.file}${m.to.rank}`;

function dividedPerft<S, M extends { from: { file: number; rank: number }; to: { file: number; rank: number } }>(
  root: S,
  legal: (s: S) => M[],
  apply: (s: S, m: M) => S,
  depth: number
): Map<string, number> {
  const perft = (s: S, d: number): number => {
    if (d === 0) return 1;
    const moves = legal(s);
    if (d === 1) return moves.length;
    return moves.reduce((sum, m) => sum + perft(apply(s, m), d - 1), 0);
  };
  const out = new Map<string, number>();
  for (const m of legal(root)) out.set(key(m), perft(apply(root, m), depth - 1));
  return out;
}

const lunaMap = dividedPerft(createInitialGameState(), lunaLegal as never, lunaMake as never, 3);
const terraMap = dividedPerft(createInitialState(), terraLegal as never, applyLegalMove as never, 3);

const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
console.log(`luna  perft(1)=${lunaMap.size} perft(3)=${sum(lunaMap)}`);
console.log(`terra perft(1)=${terraMap.size} perft(3)=${sum(terraMap)}`);

const keys = [...new Set([...lunaMap.keys(), ...terraMap.keys()])].sort();
console.log('\n분기점 (from->to : luna / terra)');
let diffTotal = 0;
for (const k of keys) {
  const a = lunaMap.get(k);
  const b = terraMap.get(k);
  if (a === b) continue;
  diffTotal += (a ?? 0) - (b ?? 0);
  console.log(`  ${k.padEnd(12)} ${String(a ?? '-').padStart(6)} / ${String(b ?? '-').padStart(6)}  Δ${(a ?? 0) - (b ?? 0)}`);
}
console.log(`\n총 차이 ${diffTotal}`);
