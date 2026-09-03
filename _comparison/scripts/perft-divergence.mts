// 분기 지점 하나를 골라 2수째 합법수 집합을 직접 비교한다
import { createInitialGameState, generateLegalMoves as lunaLegal, makeMove as lunaMake } from '../../luna/src/engine/rules';
import { createInitialState } from '../../terra/src/engine/board';
import { generateLegalMoves as terraLegal, applyLegalMove } from '../../terra/src/engine/rules';

type P = { file: number; rank: number };
type M = { from: P; to: P; piece?: { type: string; side: string } };
const key = (m: M) => `${m.from.file},${m.from.rank} -> ${m.to.file},${m.to.rank}`;

const FIRST = '9,10 -> 9,8';

const lunaRoot = createInitialGameState();
const lunaFirst = (lunaLegal(lunaRoot) as unknown as M[]).find((m) => key(m) === FIRST)!;
const lunaAfter = lunaMake(lunaRoot, lunaFirst as never);
const lunaMoves = new Map((lunaLegal(lunaAfter) as unknown as M[]).map((m) => [key(m), m]));

const terraRoot = createInitialState();
const terraFirst = (terraLegal(terraRoot) as unknown as M[]).find((m) => key(m) === FIRST)!;
const terraAfter = applyLegalMove(terraRoot, terraFirst as never);
const terraMoves = new Map((terraLegal(terraAfter) as unknown as M[]).map((m) => [key(m), m]));

console.log(`1수: ${FIRST}`);
console.log(`2수 합법수 개수 — luna ${lunaMoves.size} / terra ${terraMoves.size}\n`);

for (const [k, m] of lunaMoves) {
  if (!terraMoves.has(k)) console.log(`luna 에만 있음 : ${k}   (${m.piece?.side} ${m.piece?.type})`);
}
for (const [k, m] of terraMoves) {
  if (!lunaMoves.has(k)) console.log(`terra 에만 있음: ${k}   (${m.piece?.side} ${m.piece?.type})`);
}

console.log('\n3수째 응수 개수가 다른 2수:');
let shown = 0;
for (const [k, lm] of lunaMoves) {
  const tm = terraMoves.get(k);
  if (!tm) continue;
  const lNext = lunaMake(lunaAfter, lm as never);
  const tNext = applyLegalMove(terraAfter, tm as never);
  const la = lunaLegal(lNext) as unknown as M[];
  const tb = terraLegal(tNext) as unknown as M[];
  if (la.length === tb.length) continue;
  if (shown++ > 0) continue;

  console.log(`  ${k}  (${lm.piece?.side} ${lm.piece?.type}) → luna ${la.length} / terra ${tb.length}`);
  const tkeys = new Set(tb.map(key));
  for (const m of la) {
    if (tkeys.has(key(m))) continue;
    console.log(`      luna 에만 있는 수: ${key(m)}  piece=${m.piece?.side} ${m.piece?.type}`);
  }
  const at = (b: readonly unknown[], file: number, rank: number, idx: (f: number, r: number) => number) =>
    b[idx(file, rank)] as { side: string; type: string } | null;
  const lb = (lNext as { board: readonly unknown[] }).board;
  const tbd = (tNext as { board: readonly unknown[] }).board;
  const lunaIdx = (f: number, r: number) => (r - 1) * 9 + (f - 1);
  console.log(`      (8,10) luna=${JSON.stringify(at(lb, 8, 10, lunaIdx))} terra=${JSON.stringify(at(tbd, 8, 10, lunaIdx))}`);
  console.log(`      (7,8)  luna=${JSON.stringify(at(lb, 7, 8, lunaIdx))} terra=${JSON.stringify(at(tbd, 7, 8, lunaIdx))}`);
  console.log(`      (8,9)  luna=${JSON.stringify(at(lb, 8, 9, lunaIdx))} terra=${JSON.stringify(at(tbd, 8, 9, lunaIdx))}`);
}
