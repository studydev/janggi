#!/usr/bin/env node
// 장기 구현을 각각 서브패스 base 로 빌드하고 비교 자료와 함께 하나의 정적 사이트로 합친다.
// 출력 경로는 OUT_DIR 로 바꿀 수 있다 (Docker 빌드에서는 /site).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = process.env.OUT_DIR ? resolve(process.env.OUT_DIR) : join(root, 'dist-site');
const apps = JSON.parse(readFileSync(join(here, 'apps.json'), 'utf8'));
const comparisonRoot = join(root, '_comparison');
const dataDir = join(comparisonRoot, 'data');
const readData = (file) => JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
const stats = readData('project-stats.json');
const code = readData('code.json');
const checks = readData('checks.json');
const tokens = readData('tokens.json');
const thumbsDir = join(comparisonRoot, 'screenshots', 'thumbs');

const ENVIRONMENTS = [
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    color: '#2f6fed',
    note: 'VS Code 확장의 에이전트 모드에서 진행',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    color: '#c2560f',
    note: 'Anthropic 터미널 에이전트에서 진행',
  },
  { id: 'codex', label: 'Codex', color: '#0f766e', note: 'OpenAI Codex 에이전트에서 진행' },
];

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
const formatSpan = (durationMs) => {
  const minutes = Math.max(0, Math.round(durationMs / 60000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}시간 ${String(minutes % 60).padStart(2, '0')}분` : `${minutes}분`;
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
  const text = readFileSync(join(dataDir, fileName), 'utf8');
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

/** 에이전트가 남긴 "Time:" 표기를 밀리초로 바꾼다. "56m 5s"와 "11:31 시작 -> 12:04 종료"를 모두 받는다. */
function parseDeclaredTime(label) {
  if (!label || label === '미기록') return null;
  const range = label.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
  if (range) {
    const from = Number(range[1]) * 60 + Number(range[2]);
    const to = Number(range[3]) * 60 + Number(range[4]);
    return (to - from + (to < from ? 24 * 60 : 0)) * 60 * 1000;
  }
  const hours = Number(label.match(/(\d+)\s*h/)?.[1] ?? 0);
  const minutes = Number(label.match(/(\d+)\s*m(?!s)/)?.[1] ?? 0);
  const seconds = Number(label.match(/(\d+)\s*s/)?.[1] ?? 0);
  const total = ((hours * 60 + minutes) * 60 + seconds) * 1000;
  return total > 0 ? total : null;
}

/** 가로 막대 차트. 값이 없는 항목은 막대 없이 "미수집"으로 남긴다. */
function barChart(items, { format, unit }) {
  const rowHeight = 30;
  const labelWidth = 132;
  const valueWidth = 96;
  const width = 640;
  const barArea = width - labelWidth - valueWidth;
  const height = items.length * rowHeight;
  const maxValue = Math.max(...items.map((item) => item.value ?? 0), 1);

  const rows = items
    .map((item, index) => {
      const y = index * rowHeight;
      const label = `<text x="0" y="${y + 19}" class="c-label">${escapeHtml(item.label)}</text>`;
      if (item.value == null) {
        return `<g>${label}<text x="${labelWidth}" y="${y + 19}" class="c-none">미수집</text></g>`;
      }
      const barWidth = Math.max(2, Math.round((item.value / maxValue) * barArea));
      return `<g><title>${escapeHtml(item.label)} · ${escapeHtml(format(item.value))}</title>${label}<rect x="${labelWidth}" y="${y + 7}" width="${barWidth}" height="${rowHeight - 15}" rx="2" fill="${item.color}" opacity="0.85"/><text x="${labelWidth + barWidth + 8}" y="${y + 19}" class="c-value">${escapeHtml(format(item.value))}</text></g>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(unit)} 비교 막대 차트" preserveAspectRatio="xMinYMin meet">
      <style>
        .c-label{font:600 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#15181c}
        .c-value{font:700 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#5f6771}
        .c-none{font:500 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#a4abb2}
      </style>${rows}</svg>`;
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

const appByDir = new Map(apps.map((app) => [app.dir, app]));
const statsByName = new Map(stats.projects.map((project) => [project.name, project]));
const codeByName = new Map(code.projects.map((project) => [project.folder, project]));
const checksByName = new Map(checks.results.map((result) => [result.folder, result]));
const sessionByName = new Map(tokens.sessions.map((session) => [session.folder, session]));
const processLogs = new Map(['sol-fast', 'astra', 'codex-astra'].map((name) => [name, readProcessLog(name)]));
const thumbnails = existsSync(join(dataDir, 'thumbnails.json')) ? readData('thumbnails.json') : null;

const entries = apps
  .map((app) => {
    const project = statsByName.get(app.dir);
    const check = checksByName.get(app.dir);
    const session = sessionByName.get(app.dir);
    const log = processLogs.get(app.dir) ?? null;
    const environment = ENVIRONMENTS.find((item) => item.id === app.env) ?? ENVIRONMENTS[0];
    const loggedMs = session?.measured?.durationMs ?? null;
    const declaredMs = parseDeclaredTime(log?.declaredTime);

    return {
      ...app,
      environment,
      project,
      log,
      files: project.fileCount,
      lines: project.textLines,
      characters: project.textCharacters,
      codeLoc: project.codeLoc,
      engineLoc: codeByName.get(app.dir)?.layers?.engine?.loc ?? null,
      testCases: check?.test?.stats?.passed ?? null,
      testFiles: check?.test?.stats?.files ?? null,
      bundleKb: check?.build?.bundleKb ?? null,
      verified: Boolean(check?.test?.ok && check?.typecheck?.ok && check?.build?.ok),
      sessionMs: loggedMs ?? declaredMs,
      sessionSource: loggedMs ? '세션 로그' : declaredMs ? '에이전트 기록' : null,
      fileActiveMs: project.copiedBaseline ? null : project.measuredDurationMs,
      thumb: existsSync(join(thumbsDir, `${app.dir}.jpg`)) ? `thumbs/${app.dir}.jpg` : null,
    };
  })
  .sort(
    (left, right) =>
      ENVIRONMENTS.findIndex((env) => env.id === left.environment.id) -
        ENVIRONMENTS.findIndex((env) => env.id === right.environment.id) ||
      right.codeLoc - left.codeLoc,
  );

const totals = {
  testCases: entries.reduce((sum, entry) => sum + (entry.testCases ?? 0), 0),
  verified: entries.filter((entry) => entry.verified).length,
  timed: entries.filter((entry) => entry.sessionMs != null).length,
};

const heroMetrics = [
  { label: '구현', value: `${entries.length}<span>종</span>` },
  { label: '개발 환경', value: `${ENVIRONMENTS.length}<span>곳</span>` },
  { label: '코드', value: `${formatNumber(stats.totals.codeLoc)}<span>LOC</span>` },
  { label: '통과 테스트', value: `${formatNumber(totals.testCases)}<span>개</span>` },
  { label: '빌드·타입·테스트', value: `${totals.verified}/${entries.length}<span>전부 통과</span>` },
]
  .map((metric) => `          <div><dt>${metric.label}</dt><dd>${metric.value}</dd></div>`)
  .join('\n');

const envCards = ENVIRONMENTS.map((environment) => {
  const members = entries.filter((entry) => entry.environment.id === environment.id);
  const loc = members.reduce((sum, entry) => sum + entry.codeLoc, 0);
  const tests = members.reduce((sum, entry) => sum + (entry.testCases ?? 0), 0);
  const timed = members.filter((entry) => entry.sessionMs != null);
  const timeText = timed.length
    ? `${formatSpan(Math.min(...timed.map((entry) => entry.sessionMs)))} ~ ${formatSpan(Math.max(...timed.map((entry) => entry.sessionMs)))}`
    : '미수집';
  const models = members
    .map((entry) => `<li>${escapeHtml(entry.title)} · ${escapeHtml(entry.model)}</li>`)
    .join('\n            ');

  return `          <article class="env-card" style="--env:${environment.color}">
            <h3>${escapeHtml(environment.label)}</h3>
            <p class="env-note">${escapeHtml(environment.note)}</p>
            <dl>
              <div><dt>구현</dt><dd>${members.length}종</dd></div>
              <div><dt>통과 테스트</dt><dd>${formatNumber(tests)}개</dd></div>
              <div><dt>코드 합계</dt><dd>${formatNumber(loc)} LOC</dd></div>
              <div><dt>작업 시간</dt><dd>${escapeHtml(timeText)}</dd></div>
            </dl>
            <ul>
            ${models}
            </ul>
          </article>`;
}).join('\n');

const chartDefinitions = [
  {
    title: '작업 시간',
    sub: '명세를 받고 구현이 끝날 때까지 기록된 시간',
    unit: '작업 시간',
    pick: (entry) => entry.sessionMs,
    format: (value) => formatSpan(value),
    caption: `세션 로그 ${entries.filter((entry) => entry.sessionSource === '세션 로그').length}건, 에이전트 기록 ${entries.filter((entry) => entry.sessionSource === '에이전트 기록').length}건. 세션 로그는 대기 시간을 포함하므로 절대 비교보다 자리 차이를 보는 용도다.`,
  },
  {
    title: '코드 분량',
    sub: '주석·빈 줄을 뺀 TS·JS·CSS·HTML 라인',
    unit: '코드 LOC',
    pick: (entry) => entry.codeLoc,
    format: (value) => `${formatNumber(value)} LOC`,
    caption: '문서와 설정을 제외한 실제 코드만 센 값이다. 많다고 좋은 것은 아니며 구조 선택의 차이를 보여 준다.',
  },
  {
    title: '스스로 만든 검증',
    sub: '각 구현이 작성해 실제로 통과한 테스트',
    unit: '통과 테스트',
    pick: (entry) => entry.testCases,
    format: (value) => `${formatNumber(value)}개`,
    caption: '각 폴더에서 vitest를 직접 실행해 얻은 통과 수다. 매개변수화 테스트를 쓰면 개수가 크게 늘어난다.',
  },
  {
    title: '번들 크기',
    sub: '프로덕션 빌드의 JS 합계',
    unit: '번들 JS',
    pick: (entry) => entry.bundleKb,
    format: (value) => `${formatNumber(Math.round(value))} kB`,
    caption: 'vite build 산출물 기준이다. 폰트·아이콘 같은 선택이 크기 차이를 만든다.',
  },
];

const charts = chartDefinitions
  .map((definition) => {
    const items = entries
      .map((entry) => ({
        label: entry.title,
        value: definition.pick(entry),
        color: entry.environment.color,
      }))
      .sort((left, right) => (right.value ?? -1) - (left.value ?? -1));
    return `          <figure class="chart">
            <h3>${escapeHtml(definition.title)}</h3>
            <p class="chart-sub">${escapeHtml(definition.sub)}</p>
            ${barChart(items, definition)}
            <figcaption>${escapeHtml(definition.caption)}</figcaption>
          </figure>`;
  })
  .join('\n');

const chartLegend = ENVIRONMENTS.map(
  (environment) =>
    `          <span style="color:${environment.color}"><i></i>${escapeHtml(environment.label)}</span>`,
).join('\n');

const implCards = entries
  .map((entry) => {
    const shot = entry.thumb
      ? `<a class="impl-shot" href="/${escapeHtml(entry.path)}/"><img src="${escapeHtml(entry.thumb)}" alt="${escapeHtml(entry.title)} 대국 시작 직후 화면" loading="lazy" width="1200" height="750" /></a>`
      : '<div class="impl-shot missing">화면 캡처 준비 중</div>';
    const time = entry.sessionMs
      ? `<dd>${escapeHtml(formatSpan(entry.sessionMs))}<span class="src">${escapeHtml(entry.sessionSource)}</span></dd>`
      : '<dd class="pending">미수집</dd>';
    const tests = entry.testCases == null ? '<dd class="pending">미수집</dd>' : `<dd>${formatNumber(entry.testCases)}개</dd>`;
    const bundle = entry.bundleKb == null ? '<dd class="pending">미수집</dd>' : `<dd>${formatNumber(Math.round(entry.bundleKb))} kB</dd>`;

    return `          <article class="impl" style="--env:${entry.environment.color}">
            ${shot}
            <div class="impl-body">
              <span class="env-tag">${escapeHtml(entry.environment.label)}</span>
              <h3>${escapeHtml(entry.title)}</h3>
              <p class="model">${escapeHtml(entry.model)}</p>
              <dl>
                <div><dt>코드</dt><dd>${formatNumber(entry.codeLoc)} LOC</dd></div>
                <div><dt>통과 테스트</dt>${tests}</div>
                <div><dt>작업 시간</dt>${time}</div>
                <div><dt>번들 JS</dt>${bundle}</div>
              </dl>
              <footer>
                <a href="/${escapeHtml(entry.path)}/">직접 대국해 보기 &rarr;</a>
                <span class="path">/${escapeHtml(entry.path)}/</span>
              </footer>
            </div>
          </article>`;
  })
  .join('\n');

const resourceLinks = [
  { href: '/comparison/', title: '전체 지표 표', desc: '폴더·파일·라인·문자·코드량과 파일 활동 시간을 한 표에서 확인' },
  { href: '/comparison/details.html', title: '기존 7종 심층 리포트', desc: '요구사항 충족도, 규칙 정확도(perft), 사용량 분석' },
  { href: '/comparison/#process', title: '개발 로그 원문', desc: '새로 추가한 3종의 세션 기록과 진행 과정' },
  { href: '/comparison/project-size-time-report.txt', title: '측정 원문', desc: '규모와 시간 측정 결과를 생성한 그대로' },
]
  .map(
    (link) =>
      `          <a class="resource" href="${escapeHtml(link.href)}"><strong>${escapeHtml(link.title)}</strong><span>${escapeHtml(link.desc)}</span></a>`,
  )
  .join('\n');

const timeGaps = entries.filter((entry) => entry.sessionMs == null).map((entry) => entry.title);
const usageGaps = [...processLogs.values()].filter((log) => log.usage === '미기록' || log.steps === '미기록');
const methodGaps = [
  timeGaps.length ? `작업 시간 ${timeGaps.map((title) => `${title}`).join(', ')}` : null,
  usageGaps.length ? `사용량·단계 ${usageGaps.map((log) => log.name).join(', ')}` : null,
]
  .filter(Boolean)
  .join(' / ');
const methodTime = `기록이 남은 곳은 세션 로그의 첫 이벤트부터 마지막 이벤트까지, 그 밖에는 에이전트가 남긴 소요 시간 표기를 씁니다. 파일 생성·수정 시각으로 다시 확인할 수 있는 구현은 ${stats.projects.filter((project) => !project.copiedBaseline).length}종이며, 나머지는 저장소를 통째로 옮기면서 생성 시각이 한 시점으로 눌려 파일만으로는 되짚을 수 없습니다.`;

const analyzedAt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: stats.timeZone,
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(stats.generatedAt));
const builtAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const shotViewport = thumbnails ? `${thumbnails.viewport.width}×${thumbnails.viewport.height}` : '동일 뷰포트';

if (existsSync(thumbsDir)) cpSync(thumbsDir, join(outDir, 'thumbs'), { recursive: true });

const portalHtml = readFileSync(join(here, 'portal.template.html'), 'utf8')
  .replace('<!--ENV_COUNT-->', String(ENVIRONMENTS.length))
  .replace('<!--IMPL_COUNT-->', String(entries.length))
  .replace('          <!--HERO_METRICS-->', heroMetrics)
  .replace('          <!--ENV_CARDS-->', envCards)
  .replace('          <!--CHARTS-->', charts)
  .replace('          <!--CHART_LEGEND-->', chartLegend)
  .replace('          <!--IMPL_CARDS-->', implCards)
  .replace('          <!--RESOURCE_LINKS-->', resourceLinks)
  .replace('<!--SHOT_VIEWPORT-->', escapeHtml(shotViewport))
  .replace('<!--METHOD_TIME-->', escapeHtml(methodTime))
  .replace('<!--METHOD_GAPS-->', escapeHtml(methodGaps || '현재 확보된 범위에서는 빈 값이 없습니다.'))
  .replace('<!--ANALYZED_AT-->', escapeHtml(analyzedAt))
  .replace('<!--BUILT_AT-->', builtAt);
writeFileSync(join(outDir, 'index.html'), portalHtml, 'utf8');

const projectRows = stats.projects
  .map((project) => {
    const app = appByDir.get(project.name);
    const duration = project.copiedBaseline ? '측정 불가' : formatDuration(project.measuredDurationMs);
    const timeDetail = project.copiedBaseline
      ? '복사로 생성 시각 평탄화'
      : `${formatActivityTime(project.start.timestamp)} → ${formatActivityTime(project.measuredEnd.timestamp)}`;
    const timeClass = project.copiedBaseline ? 'time unavailable' : 'time';
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

const processCards = [...processLogs.values()]
  .map((log) => {
    const entry = entries.find((item) => item.dir === log.name);
    const partial = log.usage === '미기록' || log.steps === '미기록';
    const measuredTime = entry.fileActiveMs == null ? '측정 불가' : formatDuration(entry.fileActiveMs);
    return `          <article class="process-card" style="--accent:${entry.environment.color}">
            <span class="status">${partial ? '부분 기록' : '기록 확보'}</span>
            <h3>${escapeHtml(entry.title)}</h3>
            <p class="model">${escapeHtml(log.model)}</p>
            <dl>
              <div><dt>세션 표기 시간</dt><dd>${escapeHtml(log.declaredTime)}</dd></div>
              <div><dt>파일 활동 시간</dt><dd>${measuredTime}</dd></div>
              <div><dt>사용량</dt><dd>${escapeHtml(log.usage)}</dd></div>
              <div><dt>단계</dt><dd>${escapeHtml(log.steps)}</dd></div>
              <div><dt>결과물</dt><dd>${formatNumber(entry.files)}파일 · ${formatNumber(entry.codeLoc)} LOC</dd></div>
              <div><dt>개발 로그</dt><dd>${formatNumber(log.lineCount)}줄 · ${formatNumber(log.characterCount)}자</dd></div>
            </dl>
            <footer>
              <a href="/${escapeHtml(entry.path)}/">대국 시작</a>
              <a href="logs/${escapeHtml(log.name)}.txt">개발 로그 원문</a>
            </footer>
          </article>`;
  })
  .join('\n');

const comparisonDir = join(outDir, 'comparison');
const logsDir = join(comparisonDir, 'logs');
mkdirSync(logsDir, { recursive: true });

for (const log of processLogs.values()) {
  writeFileSync(join(logsDir, `${log.name}.txt`), log.text, 'utf8');
}
cpSync(join(comparisonRoot, 'screenshots'), join(comparisonDir, 'screenshots'), { recursive: true });
cpSync(join(dataDir, 'project-stats.json'), join(comparisonDir, 'project-stats.json'));
cpSync(join(comparisonRoot, 'project-size-time-report.md'), join(comparisonDir, 'project-size-time-report.txt'));

const reportNav = `
<div class="portal-nav"><div><a href="/comparison/">&larr; 지표 표로 돌아가기</a><a href="/">비교 홈</a></div></div>`;
const reportHtml = readFileSync(join(comparisonRoot, 'report.html'), 'utf8')
  .replace(
    '</style>',
    `.portal-nav{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--line);background:rgba(255,255,255,.95);backdrop-filter:blur(10px)}.portal-nav>div{max-width:1500px;margin:0 auto;padding:10px 28px;display:flex;gap:18px}.portal-nav a{color:var(--muted);font-size:13px;font-weight:700;text-decoration:none}.portal-nav a:hover{color:var(--ink)}</style>`,
  )
  .replace('<body>', `<body>${reportNav}`);
writeFileSync(join(comparisonDir, 'details.html'), reportHtml, 'utf8');

const unavailableCount = stats.projects.filter((project) => project.copiedBaseline).length;
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

console.log(`\n완료: ${apps.length}개 앱 + 비교 페이지 → ${outDir}`);
