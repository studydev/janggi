/**
 * 콘솔 랜덤 대국. UI 없이 엔진만으로 대국이 끝까지 진행되는지 확인한다.
 *   npm run demo:random -- --seed 7 --max 300
 */
import { renderBoard } from '../src/engine/board';
import { moveLineText } from '../src/engine/janggi-notation';
import { calculateScore, getGameResult, SIDE_LABEL } from '../src/engine/result';
import { createGame, generateLegalMoves, makeMove, pass } from '../src/engine/rules';
import { createRandom } from '../src/engine/verification';
import { SETUP_CODES, SETUP_LABELS } from '../src/engine/types';
import type { SetupCode } from '../src/engine/types';

function arg(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

const seed = arg('seed', Date.now() % 100000);
const maxPlies = arg('max', 400);
const random = createRandom(seed);
const pick = (): SetupCode => SETUP_CODES[Math.floor(random() * SETUP_CODES.length)];

const hanSetup = pick();
const choSetup = pick();
let state = createGame({ hanSetup, choSetup });

console.log(`seed=${seed}  한: ${SETUP_LABELS[hanSetup]}  초: ${SETUP_LABELS[choSetup]}`);
console.log(renderBoard(state.board));

let ply = 0;
let ended = false;
while (ply < maxPlies) {
  const result = getGameResult(state);
  if (result.status !== 'PLAYING') {
    console.log(`\n결과: ${result.status} / ${result.reason}`);
    console.log(result.winner ? `승자: ${SIDE_LABEL[result.winner]}` : '승자 없음');
    ended = true;
    break;
  }

  const moves = generateLegalMoves(state);
  if (moves.length === 0) {
    state = pass(state);
  } else {
    state = makeMove(state, moves[Math.floor(random() * moves.length)]);
  }
  console.log(moveLineText(state.moveHistory[state.moveHistory.length - 1], ply));
  ply += 1;
}

if (!ended) console.log(`\n${maxPlies}수 제한에 도달했다.`);

console.log(renderBoard(state.board));
console.log(`총 ${ply}수 / 한 ${calculateScore(state, 'HAN')}점 : 초 ${calculateScore(state, 'CHO')}점`);
