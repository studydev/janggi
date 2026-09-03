/**
 * 콘솔 랜덤 대국. 엔진만으로 대국이 끝까지 도는지 눈으로 확인하는 용도.
 *
 *   npm run play            # 씨앗 1
 *   npm run play -- 42      # 씨앗 42
 *   npm run play -- 42 -q   # 보드 출력 생략
 */
import { boardToText, HORSE_SETUP_LABELS, SIDE_LABEL } from '../engine/board';
import { formatMoveList } from '../engine/janggi-notation';
import { playRandomGame } from '../engine/selfplay';

const args = process.argv.slice(2);
const seed = Number(args.find((a) => !a.startsWith('-')) ?? 1);
const quiet = args.includes('-q');

const report = playRandomGame(seed, { validate: true });
const { finalState: state, result } = report;

if (!quiet) {
  console.log(boardToText(state.board));
  console.log('');
}

console.log(`씨앗        : ${seed}`);
console.log(
  `마상 배치   : 한 ${HORSE_SETUP_LABELS[state.setup.HAN]} / 초 ${HORSE_SETUP_LABELS[state.setup.CHO]}`,
);
console.log(`총 수       : ${report.plies}`);
console.log(`결과        : ${result.label}`);
console.log(`승자        : ${result.winner === null ? '없음(동점)' : SIDE_LABEL[result.winner]}`);
console.log(`점수        : 초 ${result.scores.CHO} / 한 ${result.scores.HAN}`);
console.log(`규칙 위반   : ${report.violations.length}건`);

for (const v of report.violations) {
  console.log(`  [${v.ply}수] ${v.kind} — ${v.detail}`);
}

if (!quiet) {
  console.log('\n마지막 10수');
  for (const line of formatMoveList(state.moveHistory).slice(-5)) console.log('  ' + line);
}

process.exit(report.violations.length === 0 ? 0 : 1);
