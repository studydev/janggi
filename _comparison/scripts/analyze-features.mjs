// P0~P12 프롬프트 요구사항이 각 구현체에 실제로 반영됐는지 소스에서 신호를 찾아 판정
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT_DIR = join(__dirname, '..', 'data');
const FOLDERS = ['luna', 'terra', 'sol', 'opus5', 'sonnet5', 'claude_opus5', 'claude_sonnet5'];
const SKIP = new Set(['node_modules', 'dist', '.git', 'coverage', '.vite']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html', '.md', '.json', '.webmanifest']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(extname(p))) out.push(p);
  }
  return out;
}

// [항목 이름, 판정 정규식, 파일 경로 필터(선택)]
const SPEC = {
  'P0 · 프로젝트 헌법': [
    ['CLAUDE.md 규칙 문서', /./, /CLAUDE\.md$/i],
    ['engine 폴더 분리', /./, /^src[\\/]engine[\\/]/],
    ['engine에 React 의존 없음', /^$/, null, 'engineClean'],
  ],
  'P1 · RULES.md': [
    ['RULES.md 존재', /장기 규칙 명세|# 장기/, /RULES\.md$/],
    ['상 = 1직진+2대각 명시', /직선 1칸 \+ 대각 2칸|1칸 \+ 대각 2|대각 2칸/, /RULES\.md$/],
    ['포 = 이동·공격 모두 넘기 명시', /이동과 공격 모두|이동·공격 모두/, /RULES\.md$/],
  ],
  'P2 · 데이터 모델': [
    ['createInitialBoard / 초기배치', /createInitialBoard|createInitialState|initialBoard|buildInitialBoard/, /\.tsx?$/],
    ['마상 배치 4종', /마상마상|상마상마|마상상마|상마마상|MSMS|SMSM/, /\.tsx?$/],
    ['isInPalace / 궁성 판정', /isInPalace|inPalace|isPalace/, /\.tsx?$/],
    ['궁성 대각선 판정', /PalaceDiagonal|palaceDiagonal|isOnDiagonal|diagonalNeighbors/, /\.tsx?$/],
    ['debugPrint 콘솔 출력', /debugPrint|renderBoardText|boardToText|printBoard/, /\.tsx?$/],
  ],
  'P3 · 기물별 이동 생성기': [
    ['차(CHA)', /generateChaMoves|chaMoves|function cha|cha\.ts/i, /\.tsx?$/],
    ['포(PO)', /generatePoMoves|poMoves|function po|po\.ts/i, /\.tsx?$/],
    ['마(MA)', /generateMaMoves|maMoves|function ma|ma\.ts/i, /\.tsx?$/],
    ['상(SANG)', /generateSangMoves|sangMoves|function sang|sang\.ts/i, /\.tsx?$/],
    ['궁·사(GUNG/SA)', /generateGungMoves|gungMoves|generateSaMoves|saMoves|palacePieces/i, /\.tsx?$/],
    ['졸·병(JOL)', /generateJolMoves|jolMoves|function jol|jol\.ts/i, /\.tsx?$/],
    ['포는 포를 넘거나 잡지 못함', /(type|piece)\s*(===|!==)\s*['"]PO['"]|isPo\(|screenIsPo|CANNON/i, /engine[\\/].*po[^\\/]*\.tsx?$|engine[\\/](validation|verification|selfplay)\.ts$/i],
  ],
  'P4 · 합법수·장군': [
    ['isAttacked', /isAttacked|isSquareAttacked|isUnderAttack/, /\.tsx?$/],
    ['isCheck', /isCheck\b|isInCheck/, /\.tsx?$/],
    ['generateLegalMoves', /generateLegalMoves|legalMoves/, /\.tsx?$/],
    ['makeMove (불변)', /makeMove|applyMove/, /\.tsx?$/],
    ['pass (한 수 쉬기)', /\bpass\b|passTurn|makePass/, /\.tsx?$/],
  ],
  'P5 · 승패·무승부': [
    ['isCheckmate', /isCheckmate|checkmate/i, /\.tsx?$/],
    ['빅장(bikjang)', /bikjang|빅장/i, /\.tsx?$/],
    ['국면 반복 무승부', /repetition|repeat(Count|ed)|positionKey|zobrist|반복/i, /\.tsx?$/],
    ['점수 계산 (덤 1.5)', /1\.5/, /\.tsx?$/],
    ['getGameResult', /getGameResult|gameResult|evaluateResult/, /\.tsx?$/],
    ['콘솔 랜덤 대국 스크립트', /random(Game|Playout)|randomGame|playRandom/i, null],
  ],
  'P6 · 규칙 검증': [
    ['perft', /perft/i, null],
    ['랜덤 대국 대량 검증', /1000|soak|invariant|불변식/i, null],
    ['undo 복원 검증', /undo/i, null],
  ],
  'P7 · 보드 렌더링': [
    ['SVG 보드', /<svg|createElementNS\(['"]http:\/\/www\.w3\.org\/2000\/svg/, /\.tsx?$/],
    ['궁성 대각선 렌더', /palace[\s\S]{0,40}(line|diagonal)|<line[\s\S]{0,200}palace|궁성/i, /\.tsx?$/],
    ['한자/한글 표기 전환', /한자|한글 표기|useHangul|labelMode|notation.*hangul/i, /\.tsx?$/],
    ['합법수 점 표시', /legalMoves|moveHint|move-dot|targets/i, /\.tsx?$/],
    ['마지막 수 하이라이트', /lastMove/i, /\.tsx?$/],
    ['드래그 앤 드롭', /onPointerDown|onDragStart|draggable|pointerdown/i, /\.tsx?$/],
    ['prefers-reduced-motion', /prefers-reduced-motion/i, null],
    ['보드 뒤집기', /flip|뒤집/i, /\.tsx?$/],
  ],
  'P8 · 게임 흐름': [
    ['대국 설정 화면', /Setup|설정 화면|GameSetup|StartScreen|대국 설정/i, /\.tsx$/],
    ['useReducer 상태관리', /useReducer/, /\.tsx?$/],
    ['한 수 쉬기 버튼', /한 수 쉬기/, /\.tsx$/],
    ['무르기', /무르기/, /\.tsx$/],
    ['기권', /기권/, /\.tsx$/],
    ['무승부 제안', /무승부/, /\.tsx$/],
    ['종료 다이얼로그', /dialog|Modal|GameOver|결과|종료/i, /\.tsx$/],
    ['경과 시간 표시', /elapsed|경과|timer/i, /\.tsx$/],
  ],
  'P9 · 기보 저장·재생': [
    ['표기 모듈 분리', /notation/i, null],
    ['JSON 내보내기/불러오기', /(export|내보내기)[\s\S]{0,60}(JSON|json)|JSON\.stringify\(/i, /\.tsx?$/],
    ['리플레이 이동 컨트롤', /replay|리플레이|처음|마지막/i, /\.tsx$/],
    ['localStorage 자동 저장', /localStorage/, /\.tsx?$/],
  ],
  'P12 · 접근성·배포': [
    ['aria-label', /aria-label/i, /\.tsx$/],
    ['키보드 조작', /onKeyDown|ArrowUp|ArrowLeft|keydown/i, /\.tsx?$/],
    ['색맹 대응 팔레트', /colorblind|색약|색맹|palette/i, /\.tsx?$/],
    ['반응형 / 터치 44px', /@media|clamp\(|44px|touch-action/i, null],
    ['PWA manifest', /"name"|manifest/i, /manifest\.webmanifest$/],
    ['Service Worker', /addEventListener\(['"]fetch|caches\.open/, /(sw|service-worker)\.js$/],
    ['에러 바운더리', /ErrorBoundary|componentDidCatch/, /\.tsx$/],
    ['README', /##|아키텍처|실행/, /README\.md$/],
  ],
};

const results = [];
for (const folder of FOLDERS) {
  const dir = join(ROOT, folder);
  if (!existsSync(dir)) continue;

  const files = walk(dir).map((f) => ({ rel: relative(dir, f), text: readFileSync(f, 'utf8') }));
  const engineFiles = files.filter((f) => /[\\/]?src[\\/]engine[\\/]/.test(f.rel) && /\.tsx?$/.test(f.rel));
  const engineClean =
    engineFiles.length > 0 && !engineFiles.some((f) => /from ['"]react|from ['"]react-dom|document\.|window\./.test(f.text));

  const groups = {};
  for (const [group, checks] of Object.entries(SPEC)) {
    groups[group] = checks.map(([label, re, fileRe, special]) => {
      if (special === 'engineClean') return { label, ok: engineClean };
      const pool = fileRe ? files.filter((f) => fileRe.test(f.rel)) : files;
      const ok = pool.some((f) => re.test(f.text));
      return { label, ok };
    });
  }

  const flat = Object.values(groups).flat();
  results.push({
    folder,
    groups,
    score: flat.filter((c) => c.ok).length,
    total: flat.length,
  });
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'features.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');

const groupNames = Object.keys(SPEC);
console.log('folder'.padEnd(16) + groupNames.map((g) => g.split(' ')[0].padStart(5)).join('') + '   total');
for (const r of results) {
  const cells = groupNames.map((g) => {
    const c = r.groups[g];
    return `${c.filter((x) => x.ok).length}/${c.length}`.padStart(5);
  });
  console.log(r.folder.padEnd(16) + cells.join('') + `   ${r.score}/${r.total}`);
}
