/**
 * perft 기준값 산출.
 *   npm run perft            # depth 1~3, 배치 MSMS/MSMS
 *   npm run perft -- 4       # depth 4 까지 (느리다)
 */
import { createInitialState, HORSE_SETUP_LABELS } from '../engine/board';
import { perft } from '../engine/perft';
import { HORSE_SETUPS, type HorseSetup } from '../engine/types';

const maxDepth = Number(process.argv[2] ?? 3);

for (const setup of HORSE_SETUPS as readonly HorseSetup[]) {
  const state = createInitialState(setup, setup);
  const counts: number[] = [];
  for (let d = 1; d <= maxDepth; d++) {
    const t0 = Date.now();
    const n = perft(state, d);
    counts.push(n);
    console.log(
      `${HORSE_SETUP_LABELS[setup]} (${setup})  depth ${d}: ${n.toLocaleString()}  (${Date.now() - t0}ms)`,
    );
  }
  console.log(`  -> [${counts.join(', ')}]`);
}
