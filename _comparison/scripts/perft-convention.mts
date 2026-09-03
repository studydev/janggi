// 컨벤션 차이(한 수 쉬기 포함 여부)로 perft 값 차이가 설명되는지 확인
import { createInitialState } from '../../terra/src/engine/board';
import { generateLegalMoves, applyLegalMove, pass, isCheck } from '../../terra/src/engine/rules';
import type { GameState } from '../../terra/src/engine/types';

function perft(state: GameState, depth: number, withPass: boolean): number {
  if (depth === 0) return 1;
  let nodes = generateLegalMoves(state).reduce((sum, m) => sum + perft(applyLegalMove(state, m), depth - 1, withPass), 0);
  if (withPass && !isCheck(state, state.turn)) nodes += perft(pass(state), depth - 1, withPass);
  return nodes;
}

const root = createInitialState();
console.log('terra 엔진 기준');
console.log('  pass 제외:', [1, 2, 3].map((d) => perft(root, d, false)).join(' / '));
console.log('  pass 포함:', [1, 2, 3].map((d) => perft(root, d, true)).join(' / '));
