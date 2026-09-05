import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..', '..');
const REPORT_PATH = join(ROOT, '_comparison', 'project-size-time-report.md');
const DATA_PATH = join(ROOT, '_comparison', 'data', 'project-stats.json');

const PROJECTS = [
  'sonnet5',
  'opus5',
  'luna',
  'terra',
  'sol',
  'sol-fast',
  'astra',
  'codex-astra',
  'claude_sonnet5',
  'claude_opus5',
];

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
// 본 작업이 끝난 뒤 잠깐 스쳐간 수정(색 조정 등)을 분리하는 간격
const TAIL_GAP_MS = 20 * 60 * 1000;
const SKIP_DIRS = new Set([
  '.git',
  '.idea',
  '.vite',
  'build',
  'coverage',
  'dist',
  'dist-ssr',
  'logs',
  'node_modules',
  'playwright-report',
  'test-results',
]);
const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.csv',
  '.gitignore',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.scss',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.webmanifest',
  '.xml',
  '.yaml',
  '.yml',
]);
const TEXT_NAMES = new Set(['Dockerfile', 'LICENSE', 'NOTICE']);
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html']);

function shouldSkipFile(name) {
  return (
    name === '.DS_Store' ||
    name.endsWith('.tsbuildinfo') ||
    name.endsWith('.local') ||
    name.endsWith('.log') ||
    (name.startsWith('.env') && name !== '.env.example')
  );
}

function creationTimeMs(stats) {
  return Number.isFinite(stats.birthtimeMs) && stats.birthtimeMs > 0
    ? stats.birthtimeMs
    : stats.ctimeMs;
}

function walkProject(projectDir) {
  const directories = [{ path: projectDir, stats: lstatSync(projectDir) }];
  const files = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    for (const entry of entries) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      if (!entry.isDirectory() && shouldSkipFile(entry.name)) continue;

      const path = join(dir, entry.name);
      const stats = lstatSync(path);
      if (entry.isDirectory()) {
        directories.push({ path, stats });
        walk(path);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        files.push({ path, stats, isSymbolicLink: entry.isSymbolicLink() });
      }
    }
  }

  walk(projectDir);
  return { directories, files };
}

function physicalLineCount(text) {
  if (text.length === 0) return 0;
  const lineBreaks = text.match(/\r\n|\n|\r/g)?.length ?? 0;
  return lineBreaks + (/\r\n$|\n$|\r$/.test(text) ? 0 : 1);
}

function isTextFile(path) {
  const name = basename(path);
  return TEXT_NAMES.has(name) || TEXT_EXTENSIONS.has(name) || TEXT_EXTENSIONS.has(extname(name).toLowerCase());
}

/** 복사·체크아웃으로 파일 생성 시각이 한 초에 몰렸는지 판정한다. */
function hasCopiedBaseline(files) {
  if (files.length < 10) return false;
  const buckets = new Map();
  for (const { stats } of files) {
    const second = Math.floor(creationTimeMs(stats) / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return Math.max(...buckets.values()) / files.length >= 0.5;
}

function latestEvent(events) {
  return [...events].sort((left, right) => {
    if (left.timeMs !== right.timeMs) return left.timeMs - right.timeMs;
    if (left.path !== right.path) return left.path.localeCompare(right.path);
    return left.action.localeCompare(right.action);
  }).at(-1);
}

function analyzeProject(name) {
  const projectDir = join(ROOT, name);
  if (!existsSync(projectDir)) throw new Error(`Missing project directory: ${name}`);

  const { directories, files } = walkProject(projectDir);
  const creationEvents = [
    ...directories.map(({ path, stats }) => ({
      path,
      type: path === projectDir ? 'root' : 'directory',
      action: 'created',
      timeMs: creationTimeMs(stats),
    })),
    ...files.map(({ path, stats }) => ({
      path,
      type: 'file',
      action: 'created',
      timeMs: creationTimeMs(stats),
    })),
  ].sort((left, right) => left.timeMs - right.timeMs || left.path.localeCompare(right.path));

  const start = creationEvents[0];
  const fileEvents = files.flatMap(({ path, stats }) => {
    const createdMs = creationTimeMs(stats);
    const events = [{ path, type: 'file', action: 'created', timeMs: createdMs }];
    if (Number.isFinite(stats.mtimeMs) && Math.abs(stats.mtimeMs - createdMs) >= 1) {
      events.push({ path, type: 'file', action: 'modified', timeMs: stats.mtimeMs });
    }
    return events;
  });
  const eventsAfterStart = fileEvents
    .filter((event) => event.timeMs >= start.timeMs)
    .sort((left, right) => left.timeMs - right.timeMs || left.path.localeCompare(right.path));
  const rawEnd = latestEvent(eventsAfterStart);
  if (!rawEnd) throw new Error(`No file activity found for project: ${name}`);

  const rawDurationMs = rawEnd.timeMs - start.timeMs;
  const copiedBaseline = hasCopiedBaseline(files);

  const clusters = [];
  for (const event of eventsAfterStart) {
    const current = clusters.at(-1);
    if (current && event.timeMs - current.at(-1).timeMs <= TAIL_GAP_MS) current.push(event);
    else clusters.push([event]);
  }
  const tailLimit = Math.max(3, Math.round(eventsAfterStart.length * 0.05));
  let kept = clusters;
  while (kept.length > 1 && kept.at(-1).length <= tailLimit) kept = kept.slice(0, -1);
  const keptEvents = kept.flat();
  const excludedTailEvents = eventsAfterStart.length - keptEvents.length;
  const excludedTailFrom = excludedTailEvents > 0 ? clusters[kept.length][0].timeMs : null;

  const trimmedEnd = latestEvent(keptEvents);
  const adjusted = !copiedBaseline && trimmedEnd.timeMs - start.timeMs > TWO_HOURS_MS;
  const eligibleEvents = adjusted
    ? keptEvents.filter((event) => event.timeMs <= start.timeMs + TWO_HOURS_MS)
    : keptEvents;
  const measuredEnd = latestEvent(eligibleEvents);
  if (!measuredEnd) throw new Error(`No activity within the measurement window: ${name}`);

  let textFiles = 0;
  let textLines = 0;
  let textCharacters = 0;
  let codeFiles = 0;
  let codeLoc = 0;
  for (const file of files) {
    if (file.isSymbolicLink || !isTextFile(file.path)) continue;
    const text = readFileSync(file.path, 'utf8');
    textFiles++;
    textLines += physicalLineCount(text);
    textCharacters += Array.from(text).length;
    if (CODE_EXTENSIONS.has(extname(file.path).toLowerCase())) {
      codeFiles++;
      codeLoc += text.split(/\r\n|\n|\r/).filter((line) => line.trim()).length;
    }
  }

  return {
    name,
    directoryCount: directories.length - 1,
    fileCount: files.length,
    textFiles,
    textLines,
    textCharacters,
    codeFiles,
    codeLoc,
    start,
    rawEnd,
    measuredEnd,
    rawDurationMs,
    measuredDurationMs: copiedBaseline ? null : measuredEnd.timeMs - start.timeMs,
    copiedBaseline,
    excludedTailEvents,
    excludedTailFrom,
    adjusted,
  };
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function formatTime(timeMs) {
  const parts = Object.fromEntries(
    dateFormatter
      .formatToParts(new Date(timeMs))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} KST`;
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function eventLabel(event, projectName) {
  const labels = {
    root: '루트 폴더 생성',
    directory: '폴더 생성',
    created: '파일 생성',
    modified: '파일 수정',
  };
  const label = event.type === 'file' ? labels[event.action] : labels[event.type];
  const path = relative(join(ROOT, projectName), event.path) || '.';
  return `${formatTime(event.timeMs)}<br>\`${path}\` (${label})`;
}

function maxBy(results, key) {
  return results.reduce((best, result) => (result[key] > best[key] ? result : best));
}

function minBy(results, key) {
  return results.reduce((best, result) => (result[key] < best[key] ? result : best));
}

const results = PROJECTS.map(analyzeProject);
const totals = results.reduce(
  (sum, result) => ({
    directoryCount: sum.directoryCount + result.directoryCount,
    fileCount: sum.fileCount + result.fileCount,
    textFiles: sum.textFiles + result.textFiles,
    textLines: sum.textLines + result.textLines,
    textCharacters: sum.textCharacters + result.textCharacters,
    codeFiles: sum.codeFiles + result.codeFiles,
    codeLoc: sum.codeLoc + result.codeLoc,
  }),
  { directoryCount: 0, fileCount: 0, textFiles: 0, textLines: 0, textCharacters: 0, codeFiles: 0, codeLoc: 0 },
);
const measurableResults = results.filter((result) => !result.copiedBaseline);
const adjustedCount = results.filter((result) => result.adjusted).length;
const unavailableCount = results.length - measurableResults.length;
const mostDirectories = maxBy(results, 'directoryCount');
const mostFiles = maxBy(results, 'fileCount');
const mostLines = maxBy(results, 'textLines');
const mostCharacters = maxBy(results, 'textCharacters');
const mostCodeLoc = maxBy(results, 'codeLoc');
const shortest = minBy(measurableResults, 'measuredDurationMs');
const longest = maxBy(measurableResults, 'measuredDurationMs');

const sizeRows = results.map(
  (result) =>
    `| \`${result.name}\` | ${formatNumber(result.directoryCount)} | ${formatNumber(result.fileCount)} | ${formatNumber(result.textFiles)} | ${formatNumber(result.textLines)} | ${formatNumber(result.textCharacters)} | ${formatNumber(result.codeFiles)} | ${formatNumber(result.codeLoc)} |`,
);
sizeRows.push(
  `| **합계** | **${formatNumber(totals.directoryCount)}** | **${formatNumber(totals.fileCount)}** | **${formatNumber(totals.textFiles)}** | **${formatNumber(totals.textLines)}** | **${formatNumber(totals.textCharacters)}** | **${formatNumber(totals.codeFiles)}** | **${formatNumber(totals.codeLoc)}** |`,
);

const timingRows = results.map((result) => {
  const excluded = result.excludedTailEvents
    ? `${formatNumber(result.excludedTailEvents)}건 · ${formatTime(result.excludedTailFrom)} 이후`
    : '없음';
  const note = result.copiedBaseline
    ? '복사로 생성 시각 평탄화'
    : result.adjusted
      ? '2시간 상한 적용'
      : '없음';
  return `| \`${result.name}\` | ${eventLabel(result.start, result.name)} | ${result.copiedBaseline ? '-' : eventLabel(result.measuredEnd, result.name)} | **${result.copiedBaseline ? '측정 불가' : formatDuration(result.measuredDurationMs)}** | ${excluded} | ${note} |`;
});

const generatedAtMs = Math.floor(Date.now() / 1000) * 1000;
const publicEvent = (event, projectName) => ({
  timestamp: new Date(event.timeMs).toISOString(),
  path: relative(join(ROOT, projectName), event.path) || '.',
  type: event.type,
  action: event.action,
});
const publicResults = results.map((result) => ({
  name: result.name,
  directoryCount: result.directoryCount,
  fileCount: result.fileCount,
  textFiles: result.textFiles,
  textLines: result.textLines,
  textCharacters: result.textCharacters,
  codeFiles: result.codeFiles,
  codeLoc: result.codeLoc,
  start: publicEvent(result.start, result.name),
  rawEnd: publicEvent(result.rawEnd, result.name),
  measuredEnd: result.copiedBaseline ? null : publicEvent(result.measuredEnd, result.name),
  rawDurationMs: result.rawDurationMs,
  measuredDurationMs: result.measuredDurationMs,
  copiedBaseline: result.copiedBaseline,
  excludedTailEvents: result.excludedTailEvents,
  excludedTailFrom: result.excludedTailFrom ? new Date(result.excludedTailFrom).toISOString() : null,
  adjusted: result.adjusted,
}));

const report = `# 프로젝트 규모 및 파일 활동 시간 비교

- 생성 시각: ${formatTime(generatedAtMs)}
- 대상: ${PROJECTS.map((name) => `\`${name}\``).join(', ')}
- 시간대: Asia/Seoul (KST)
- 시간 측정 가능: ${measurableResults.length}개 / ${results.length}개 (복사로 생성 시각이 평탄화되어 측정 불가 ${unavailableCount}개)
- 2시간 보정 적용: ${adjustedCount}개 / 측정 가능 ${measurableResults.length}개

## 요약

- 하위 폴더가 가장 많은 프로젝트: \`${mostDirectories.name}\` (${formatNumber(mostDirectories.directoryCount)}개)
- 파일이 가장 많은 프로젝트: \`${mostFiles.name}\` (${formatNumber(mostFiles.fileCount)}개)
- 텍스트 전체 라인이 가장 많은 프로젝트: \`${mostLines.name}\` (${formatNumber(mostLines.textLines)}줄)
- 텍스트 문자가 가장 많은 프로젝트: \`${mostCharacters.name}\` (${formatNumber(mostCharacters.textCharacters)}자)
- 코드 비공백 LOC가 가장 많은 프로젝트: \`${mostCodeLoc.name}\` (${formatNumber(mostCodeLoc.codeLoc)} LOC)
- 측정 가능한 프로젝트의 최종 시간: 최단 \`${shortest.name}\` (${formatDuration(shortest.measuredDurationMs)}), 최장 \`${longest.name}\` (${formatDuration(longest.measuredDurationMs)})

## 규모 비교

| 프로젝트 | 하위 폴더 | 전체 파일 | 텍스트 파일 | 텍스트 전체 라인 | 텍스트 문자 수 | 코드 파일 | 코드 비공백 LOC |
|---|---:|---:|---:|---:|---:|---:|---:|
${sizeRows.join('\n')}

## 파일 활동 시간 비교

기간은 최초 폴더/파일 생성 시각부터 마지막 파일 생성/수정 시각까지 계산한다. 본 작업이 끝난 뒤 20분 이상 떨어져 잠긐 발생한 소규모 수정(색 조정 등)은 꼬리 구간으로 보고 측정에서 제외한다. 그 뒤에도 구간이 2시간을 넘으면 시작 후 2시간 이내의 마지막 이벤트를 종료점으로 사용한다.

| 프로젝트 | 최초 생성 | 측정 기준 최종 파일 | 최종 측정 시간 | 제외한 후속 수정 | 비고 |
|---|---|---|---:|---|---|
${timingRows.join('\n')}

## 측정 기준

- 폴더 수는 프로젝트 루트를 제외한 재귀 하위 폴더 수다. 파일 수는 포함된 모든 파일과 심볼릭 링크 수다.
- 제외 폴더: ${[...SKIP_DIRS].sort().map((name) => `\`${name}\``).join(', ')}.
- 제외 파일: \`.DS_Store\`, \`*.tsbuildinfo\`, \`*.local\`, \`*.log\`, 비예제 \`.env*\` 파일.
- 텍스트 전체 라인은 텍스트 확장자 및 \`Dockerfile\`/\`LICENSE\`/\`NOTICE\`의 빈 줄을 포함한 물리적 라인 수다. 텍스트 문자 수는 같은 파일에서 줄바꿈과 공백을 포함한 Unicode 코드 포인트 수다. 바이너리 파일은 파일 수에는 포함하지만 라인·문자 수에서는 제외한다.
- 코드 비공백 LOC는 기존 비교기와 동일하게 \`.ts\`, \`.tsx\`, \`.js\`, \`.jsx\`, \`.mjs\`, \`.cjs\`, \`.css\`, \`.html\` 파일의 공백이 아닌 라인만 센 값이다.
- 최초 생성은 프로젝트 루트, 포함된 하위 폴더, 파일의 \`birthtime\` 최솟값이다. 파일 활동은 각 파일의 \`birthtime\`(생성)과 \`mtime\`(수정)을 별도 이벤트로 비교한다.
- 파일이 10개 이상인 프로젝트에서 파일 생성 시각의 절반 이상이 같은 1초에 몰려 있으면 일괄 복사·체크아웃으로 기준선이 재설정된 것으로 보고 \`측정 불가\`로 표시한다. 이 경우 소요 시간은 세션 기록을 근거로 써야 한다.
- 마지막 활동 묶음이 직전 활동과 20분 이상 떨어져 있고 전체 이벤트의 5% 이하이면 본 작업 이후의 짧은 손질로 보고 측정 구간에서 제외한다.
- 파일시스템 생성 시각은 복사, 압축 해제, 체크아웃 과정에서 재설정될 수 있다. 따라서 이 결과는 현재 볼륨의 메타데이터 기준이며 원래 LLM 세션 시간과 다를 수 있다.
`;

writeFileSync(
  DATA_PATH,
  JSON.stringify(
    {
      generatedAt: new Date(generatedAtMs).toISOString(),
      timeZone: 'Asia/Seoul',
      twoHourLimitMs: TWO_HOURS_MS,
      projects: publicResults,
      totals,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);
writeFileSync(REPORT_PATH, report, 'utf8');
console.log(`Wrote ${relative(ROOT, DATA_PATH)} and ${relative(ROOT, REPORT_PATH)}`);
for (const result of results) {
  console.log(
    `${result.name.padEnd(16)} dirs=${String(result.directoryCount).padStart(3)} files=${String(result.fileCount).padStart(3)} lines=${String(result.textLines).padStart(6)} chars=${String(result.textCharacters).padStart(7)} duration=${result.copiedBaseline ? 'unavailable' : formatDuration(result.measuredDurationMs)} excludedTail=${result.excludedTailEvents}`,
  );
}