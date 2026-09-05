#!/usr/bin/env node
// 장기 구현을 각각 서브패스 base 로 빌드하고 비교 자료와 함께 하나의 정적 사이트로 합친다.
// 출력 경로는 OUT_DIR 로 바꿀 수 있다 (Docker 빌드에서는 /site).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = process.env.OUT_DIR ? resolve(process.env.OUT_DIR) : join(root, 'dist-site');
const apps = JSON.parse(readFileSync(join(here, 'apps.json'), 'utf8'));
const comparisonRoot = join(root, '_comparison');
const stats = JSON.parse(readFileSync(join(comparisonRoot, 'data', 'project-stats.json'), 'utf8'));

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(value);
const formatDuration = (durationMs) => {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};
const physicalLineCount = (text) => {
  if (text.length === 0) return 0;
  const breaks = text.match(/\r\n|\n|\r/g)?.length ?? 0;
  return breaks + (/\r\n$|\n$|\r$/.test(text) ? 0 : 1);
};
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: stats.timeZone,
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const formatActivityTime = (timestamp) => dateFormatter.format(new Date(timestamp)).replace(/\. /g, '.');

function readProcessLog(name) {
  const fileName = `make-${name}.md`;
  const text = readFileSync(join(comparisonRoot, 'data', fileName), 'utf8');
  const field = (key) => text.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'))?.[1]?.trim() || '미기록';
  const usage = field('Usage');
  return {
    name,
    fileName,
    text,
    model: field('Model'),
    usage: usage.toLowerCase() === 'credit' ? '미기록' : usage,
    declaredTime: field('Time'),
    steps: field('Steps'),
    lineCount: physicalLineCount(text),
    characterCount: Array.from(text).length,
  };
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const app of apps) {
  const cwd = join(root, app.dir);
  console.log(`\n=== build ${app.dir} -> /${app.path}/ ===`);
  execFileSync(npm, ['run', 'build', '--', `--base=/${app.path}/`], {
    cwd,
    stdio: 'inherit',
    shell: isWindows, // Windows 에서 npm.cmd 실행에 필요
  });
  cpSync(join(cwd, 'dist'), join(outDir, app.path), { recursive: true });
}

const cards = apps
  .map(
    (app) => `        <a class="card" href="/${app.path}/">
          <div class="card-top">
            <h2>${escapeHtml(app.title)}</h2>
            <span class="path">/${escapeHtml(app.path)}/</span>
          </div>
          <p>${escapeHtml(app.desc)}</p>
          <footer>
            <span class="dir">${escapeHtml(app.dir)}/</span>
            <span class="go">대국 시작 &rarr;</span>
          </footer>
        </a>`,
  )
  .join('\n');

const html = readFileSync(join(here, 'landing.template.html'), 'utf8')
  .replace('        <!--CARDS-->', cards)
  .replaceAll('<!--APP_COUNT-->', String(apps.length))
  .replace('<!--BUILT_AT-->', new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC');

writeFileSync(join(outDir, 'index.html'), html, 'utf8');

const appByDir = new Map(apps.map((app) => [app.dir, app]));
const projectRows = stats.projects
  .map((project) => {
    const app = appByDir.get(project.name);
    const duration = project.metadataReset ? '측정 불가' : formatDuration(project.measuredDurationMs);
    const timeDetail = project.metadataReset
      ? '메타데이터 재설정'
      : `${formatActivityTime(project.start.timestamp)} → ${formatActivityTime(project.measuredEnd.timestamp)}`;
    const timeClass = project.metadataReset ? 'time unavailable' : 'time';
    const runLink = app
      ? `<a class="run-link" href="/${escapeHtml(app.path)}/">대국 시작</a>`
      : '<span class="time-note">미배포</span>';
    return `              <tr>
                <th class="project" scope="row">${escapeHtml(project.name)}</th>
                <td class="num">${formatNumber(project.directoryCount)}</td>
                <td class="num">${formatNumber(project.fileCount)}</td>
                <td class="num">${formatNumber(project.textFiles)}</td>
                <td class="num">${formatNumber(project.textLines)}</td>
                <td class="num">${formatNumber(project.textCharacters)}</td>
                <td class="num">${formatNumber(project.codeFiles)}</td>
                <td class="num">${formatNumber(project.codeLoc)}</td>
                <td><span class="${timeClass}">${duration}</span><span class="time-note">${escapeHtml(timeDetail)}</span></td>
                <td>${runLink}</td>
              </tr>`;
  })
  .join('\n');

const processDefinitions = [
  { name: 'sol-fast', accent: '#14735d' },
  { name: 'astra', accent: '#b33b32' },
  { name: 'codex-astra', accent: '#a77624' },
];
const processLogs = processDefinitions.map(({ name, accent }) => ({
  ...readProcessLog(name),
  accent,
  project: stats.projects.find((project) => project.name === name),
  app: appByDir.get(name),
}));
const processCards = processLogs
  .map((log) => {
    const partial = log.usage === '미기록' || log.steps === '미기록';
    const measuredTime = log.project.metadataReset
      ? '측정 불가'
      : formatDuration(log.project.measuredDurationMs);
    return `          <article class="process-card" style="--accent:${log.accent}">
            <span class="status">${partial ? '부분 기록' : '기록 확보'}</span>
            <h3>${escapeHtml(log.app.title)}</h3>
            <p class="model">${escapeHtml(log.model)}</p>
            <dl>
              <div><dt>세션 표기 시간</dt><dd>${escapeHtml(log.declaredTime)}</dd></div>
              <div><dt>파일 활동 시간</dt><dd>${measuredTime}</dd></div>
              <div><dt>사용량</dt><dd>${escapeHtml(log.usage)}</dd></div>
              <div><dt>단계</dt><dd>${escapeHtml(log.steps)}</dd></div>
              <div><dt>결과물</dt><dd>${formatNumber(log.project.fileCount)}파일 · ${formatNumber(log.project.codeLoc)} LOC</dd></div>
              <div><dt>개발 로그</dt><dd>${formatNumber(log.lineCount)}줄 · ${formatNumber(log.characterCount)}자</dd></div>
            </dl>
            <footer>
              <a href="/${escapeHtml(log.app.path)}/">대국 시작</a>
              <a href="logs/${escapeHtml(log.name)}.txt">개발 로그 원문</a>
            </footer>
          </article>`;
  })
  .join('\n');

const comparisonDir = join(outDir, 'comparison');
const logsDir = join(comparisonDir, 'logs');
mkdirSync(logsDir, { recursive: true });

for (const log of processLogs) {
  writeFileSync(join(logsDir, `${log.name}.txt`), log.text, 'utf8');
}
cpSync(join(comparisonRoot, 'screenshots'), join(comparisonDir, 'screenshots'), { recursive: true });
cpSync(join(comparisonRoot, 'data', 'project-stats.json'), join(comparisonDir, 'project-stats.json'));
cpSync(join(comparisonRoot, 'project-size-time-report.md'), join(comparisonDir, 'project-size-time-report.txt'));

const reportNav = `
<div class="portal-nav"><div><a href="/comparison/">&larr; 현재 비교로 돌아가기</a><a href="/">게임 선택</a></div></div>`;
const reportHtml = readFileSync(join(comparisonRoot, 'report.html'), 'utf8')
  .replace(
    '</style>',
    `.portal-nav{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--line);background:rgba(255,255,255,.95);backdrop-filter:blur(10px)}.portal-nav>div{max-width:1500px;margin:0 auto;padding:10px 28px;display:flex;gap:18px}.portal-nav a{color:var(--muted);font-size:13px;font-weight:700;text-decoration:none}.portal-nav a:hover{color:var(--ink)}</style>`,
  )
  .replace('<body>', `<body>${reportNav}`);
writeFileSync(join(comparisonDir, 'details.html'), reportHtml, 'utf8');

const unavailableCount = stats.projects.filter((project) => project.metadataReset).length;
const analyzedAt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: stats.timeZone,
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(stats.generatedAt));
const builtAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const comparisonHtml = readFileSync(join(here, 'comparison.template.html'), 'utf8')
  .replaceAll('<!--PROJECT_COUNT-->', formatNumber(stats.projects.length))
  .replace('<!--TOTAL_FILES-->', formatNumber(stats.totals.fileCount))
  .replace('<!--TOTAL_LINES-->', formatNumber(stats.totals.textLines))
  .replace('<!--TOTAL_CHARACTERS-->', formatNumber(stats.totals.textCharacters))
  .replace('<!--TOTAL_LOC-->', formatNumber(stats.totals.codeLoc))
  .replace('              <!--PROJECT_ROWS-->', projectRows)
  .replace('          <!--PROCESS_CARDS-->', processCards)
  .replace('<!--UNAVAILABLE_COUNT-->', formatNumber(unavailableCount))
  .replace('<!--ANALYZED_AT-->', escapeHtml(analyzedAt))
  .replace('<!--BUILT_AT-->', builtAt);
writeFileSync(join(comparisonDir, 'index.html'), comparisonHtml, 'utf8');

console.log(`\n완료: ${apps.length}개 앱 + 비교 자료 → ${outDir}`);
