#!/usr/bin/env node
// 장기 구현을 각각 서브패스 base 로 빌드하고 비교 자료와 함께 하나의 정적 사이트로 합친다.
// 출력 경로는 OUT_DIR 로 바꿀 수 있다 (Docker 빌드에서는 /site).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { developmentRecords, formatUsd } from './development-records.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = process.env.OUT_DIR ? resolve(process.env.OUT_DIR) : join(root, 'dist-site');
const apps = JSON.parse(readFileSync(join(here, 'apps.json'), 'utf8'));
const developmentData = JSON.parse(readFileSync(join(here, 'development-records.json'), 'utf8'));
const records = developmentRecords(apps, developmentData);
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
    icon: 'github-copilot.svg',
    note: 'VS Code 확장의 에이전트 모드에서 진행',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    color: '#c2560f',
    icon: 'claude.svg',
    note: 'Anthropic 터미널 에이전트에서 진행',
  },
  {
    id: 'codex',
    label: 'Codex',
    color: '#0f766e',
    icon: 'openai.svg',
    note: 'OpenAI Codex 에이전트에서 진행',
  },
];

// GitHub Copilot 구현 바로 뒤에 같은 모델의 다른 환경 구현이 오도록 짝짓는다(2열 기준).
const DISPLAY_ORDER = [
  'astra',
  'codex-astra',
  'opus5',
  'claude_opus5',
  'sonnet5',
  'claude_sonnet5',
  'sol-fast',
  'sol',
  'terra',
  'luna',
];

/** 원본 파일 시각이 남은 환경에서 재어 넣은 실측값. 버전마다 비어 있을 수 있다. */
const measuredBuilds = existsSync(join(dataDir, 'build-times.json')) ? readData('build-times.json') : { builds: {} };

const iconCache = new Map();
function readIcon(environment) {
  if (!iconCache.has(environment.id)) {
    iconCache.set(environment.id, readFileSync(join(here, 'icons', environment.icon), 'utf8'));
  }
  return iconCache.get(environment.id);
}

function brandIcon(environment) {
  return readIcon(environment)
    .replace(/<title>.*?<\/title>/, '')
    .replace('<svg', '<svg class="brand" aria-hidden="true" focusable="false"')
    .replace('<path', '<path fill="currentColor"');
}

/** 차트 라벨 앞에 쓸 수 있도록 24×24 아이콘 경로만 넘긴다. */
function brandPath(environment) {
  return readIcon(environment).match(/<path[^>]*\sd="([^"]+)"/)?.[1] ?? '';
}

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
  const record = records.get(name);
  const fileName = record.logFile;
  const text = readFileSync(join(dataDir, fileName), 'utf8');
  const model = text.split('\n').find((line) => line.startsWith('| Model |'))?.split('|')[2]?.trim() ?? '미기록';
  return {
    name,
    fileName,
    text,
    model,
    usage: record.env === 'copilot' ? `${formatNumber(record.credits)} 크레딧 · ${formatUsd(record.usd)}` : `${record.plan} · ${record.usage}`,
    declaredTime: record.durationSeconds == null ? '미기록' : formatDuration(record.durationSeconds * 1000),
    steps: record.steps == null ? '미기록' : String(record.steps),
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

/** 첫 요청 이후의 새 지시(색 변경·실행 요청)는 초기 구현 다음 작업이므로 그 시점을 경계로 본다. */
const CONTINUATION_PROMPT = /^\[Terminal\b|^(?:try again|continue|계속)\b/i;
function nextInstruction(session) {
  const followUp = (session?.measured?.userPrompts ?? [])
    .slice(1)
    .find((prompt) => !CONTINUATION_PROMPT.test((prompt.text ?? '').trim()));
  if (!followUp) return null;
  return { ts: Date.parse(followUp.ts), note: (followUp.text ?? '').replace(/\s+/g, ' ').slice(0, 34) };
}

/** 초기 구현 구간. 실측값이 있으면 그것을, 없으면 경계 이전에 손대본 파일 시각을, 둘 다 없을 때만 지시 시점을 상한으로 쓴다. */
function initialBuild(session, project, declaredMs) {
  const measured = measuredBuilds.builds?.[project.name];
  if (measured?.startedAt && measured?.finishedAt) {
    return {
      ms: Date.parse(measured.finishedAt) - Date.parse(measured.startedAt),
      source: '실측',
      bounded: false,
      note: null,
    };
  }

  const cutoff = nextInstruction(session);
  const sessionStart = session?.measured?.firstTs ?? null;

  if (!project.copiedBaseline) {
    const fileStart = Date.parse(project.start.timestamp);
    const fileEnd = Date.parse(project.measuredEnd.timestamp);
    if (!cutoff || fileEnd <= cutoff.ts) {
      return { ms: fileEnd - fileStart, source: '파일 활동', bounded: false, note: null };
    }
  }
  if (sessionStart && cutoff) {
    return { ms: cutoff.ts - sessionStart, source: '세션 로그', bounded: true, note: cutoff.note };
  }
  if (sessionStart) {
    return { ms: session.measured.durationMs, source: '세션 로그', bounded: false, note: null };
  }
  return declaredMs == null ? null : { ms: declaredMs, source: '에이전트 기록', bounded: false, note: null };
}

/** 가로 막대 차트. 값이 없는 항목은 막대 없이 "미수집"으로 남긴다. */
function barChart(items, { format, unit }) {
  const rowHeight = 30;
  const iconSize = 12;
  const labelWidth = 158;
  const valueWidth = 96;
  const width = 660;
  const barArea = width - labelWidth - valueWidth;
  const height = items.length * rowHeight;
  const maxValue = Math.max(...items.map((item) => item.value ?? 0), 1);

  const rows = items
    .map((item, index) => {
      const y = index * rowHeight;
      const icon = item.iconPath
        ? `<g transform="translate(0 ${y + 8}) scale(${iconSize / 24})"><path d="${item.iconPath}" fill="${item.color}"/></g>`
        : '';
      const label = `${icon}<text x="${iconSize + 6}" y="${y + 19}" class="c-label">${escapeHtml(item.label)}</text>`;
      if (item.value == null) {
        return `<g>${label}<text x="${labelWidth}" y="${y + 19}" class="c-none">미수집</text></g>`;
      }
      const barWidth = Math.max(2, Math.round((item.value / maxValue) * barArea));
      const text = item.bounded ? `≤ ${format(item.value)}` : format(item.value);
      return `<g><title>${escapeHtml(item.label)} · ${escapeHtml(text)}</title>${label}<rect x="${labelWidth}" y="${y + 7}" width="${barWidth}" height="${rowHeight - 15}" rx="2" fill="${item.color}" opacity="${item.bounded ? 0.45 : 0.85}"/><text x="${labelWidth + barWidth + 8}" y="${y + 19}" class="c-value">${escapeHtml(text)}</text></g>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(unit)} 비교 막대 차트" preserveAspectRatio="xMinYMin meet">
      <style>
        .c-label{font:600 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#15181c}
        .c-value{font:700 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#5f6771}
        .c-none{font:500 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#a4abb2}
      </style>${rows}</svg>`;
}


const portalOnly = process.argv.includes('--portal-only');
if (portalOnly) {
  for (const app of apps) {
    if (!existsSync(join(outDir, app.path, 'index.html'))) throw new Error(`Build apps first: ${app.dir}`);
  }
} else {
  rmSync(outDir, { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });

for (const app of portalOnly ? [] : apps) {
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
const processLogs = new Map(apps.map((app) => [app.dir, readProcessLog(app.dir)]));
const thumbnails = existsSync(join(dataDir, 'thumbnails.json')) ? readData('thumbnails.json') : null;

/** 테마 파라미터를 지원하는 앱은 캡처와 같은 밝은 테마로 열리게 한다. */
function appHref(app) {
  const html = readFileSync(join(outDir, app.path, 'index.html'), 'utf8');
  return html.includes('scoutTheme') ? `/${app.path}/?scoutTheme=light` : `/${app.path}/`;
}

const entries = apps
  .map((app) => {
    const project = statsByName.get(app.dir);
    const check = checksByName.get(app.dir);
    const session = sessionByName.get(app.dir);
    const log = processLogs.get(app.dir) ?? null;
    const environment = ENVIRONMENTS.find((item) => item.id === app.env) ?? ENVIRONMENTS[0];
    const record = records.get(app.dir);
    const build = record.durationSeconds == null ? null : {
      ms: record.durationSeconds * 1000,
      source: '개발 기록',
      bounded: false,
      note: record.note,
    };

    return {
      ...app,
      environment,
      record,
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
      buildMs: build?.ms ?? null,
      buildBounded: build?.bounded ?? false,
      buildSource: build?.source ?? null,
      buildNote: build?.note ?? null,
      fileActiveMs: project.copiedBaseline ? null : project.measuredDurationMs,
      thumb: existsSync(join(thumbsDir, `${app.dir}.jpg`)) ? `thumbs/${app.dir}.jpg` : null,
      themeAware: Boolean(thumbnails?.thumbnails?.find((shot) => shot.dir === app.dir)?.themeAware),
      href: appHref(app),
    };
  })
  .sort((left, right) => DISPLAY_ORDER.indexOf(left.dir) - DISPLAY_ORDER.indexOf(right.dir));

const totals = {
  testCases: entries.reduce((sum, entry) => sum + (entry.testCases ?? 0), 0),
  verified: entries.filter((entry) => entry.verified).length,
  timed: entries.filter((entry) => entry.buildMs != null).length,
};

const comparisonRows = entries.map((entry, index) => {
  const cost = entry.record.usd ?? entry.record.estimate?.usd;
  const costKind = entry.record.usd != null ? '크레딧 환산' : entry.record.estimate.conditional ? '조건부 배분 추정' : '구독료 배분 추정';
  const usage = entry.record.env === 'copilot'
    ? `${formatNumber(entry.record.credits)} 크레딧`
    : `${entry.record.plan} · ${entry.record.usage}`;
  const image = entry.thumb
    ? `<img src="/${escapeHtml(entry.thumb)}" alt="" width="72" height="45" />`
    : '';
  return `<tr data-project="${escapeHtml(entry.dir)}" data-env="${entry.environment.id}" data-order="${index}" data-cost="${cost ?? ''}" data-time="${entry.record.durationSeconds ?? ''}">
    <th scope="row"><a class="result-link" href="#result-${entry.dir}">${image}<span>${escapeHtml(entry.log.model)}<small>${escapeHtml(entry.dir)}</small></span></a></th>
    <td><span class="platform" style="--env:${entry.environment.color}">${brandIcon(entry.environment)}${escapeHtml(entry.environment.label)}</span></td>
    <td class="usage-cell">${escapeHtml(usage)}</td>
    <td class="money"><span class="cost-value">${entry.record.usd == null ? '약 ' : ''}${formatUsd(cost)}</span><small class="cost-kind">${costKind}</small></td>
    <td class="numeric">${entry.buildMs == null ? '미기록' : formatDuration(entry.buildMs)}</td>
    <td class="numeric">${entry.record.steps ?? '미기록'}</td>
    <td class="numeric">${formatNumber(entry.files)}</td>
    <td class="numeric">${formatNumber(entry.lines)}</td>
    <td class="numeric">${formatNumber(entry.codeLoc)}</td>
    <td class="result-note">${escapeHtml(entry.record.note)}</td>
    <td><a class="app-link" href="${escapeHtml(entry.href)}" aria-label="${escapeHtml(entry.environment.label + ' ' + entry.title)} 앱 열기">앱 열기</a></td>
  </tr>`;
}).join('\n');

const allocation = developmentData.subscriptionAllocation;
const monthlyWindows = allocation.daysPerMonth * allocation.windowsPerDay;
const windowUsd = allocation.monthlyUsd / monthlyWindows;
function costChart(chartEntries, scale, title) {
  return `<figure class="cost-chart"><h3>${title}</h3>
    <p class="cost-axis">선형 축: $0 → ${formatUsd(scale)} USD</p>
    <ol>${chartEntries.map(entry => {
      const value = entry.record.usd ?? entry.record.estimate.usd;
      const estimated = entry.record.usd == null;
      const kind = estimated ? (entry.record.estimate.conditional ? '조건부 배분 추정' : '구독료 배분 추정') : '크레딧 환산';
      return `<li class="cost-row" data-project="${entry.dir}" data-value="${value}" data-scale="${scale}">
        <span class="cost-label">${escapeHtml(entry.title)}<small>${escapeHtml(entry.environment.label)} · ${kind}</small></span>
        <span class="cost-track" aria-hidden="true"><span class="cost-bar${estimated ? ' estimated' : ''}" style="width:${value / scale * 100}%;--env:${entry.environment.color}"></span></span>
        <strong>${estimated ? '약 ' : ''}${formatUsd(value)}</strong></li>`;
    }).join('')}</ol></figure>`;
}
const costEntries = [...entries].sort((left, right) => (right.record.usd ?? right.record.estimate.usd) - (left.record.usd ?? left.record.estimate.usd));
const fullScale = Math.max(1, Math.ceil(Math.max(...costEntries.map(entry => entry.record.usd ?? entry.record.estimate.usd)) / 10) * 10);
const subscriptionEntries = costEntries.filter(entry => entry.record.estimate);
const subscriptionScale = Math.max(1, Math.ceil(Math.max(...subscriptionEntries.map(entry => entry.record.estimate.usd))));
const costCharts = costChart(costEntries, fullScale, '전체 10개 · 공통 달러 축')
  + costChart(subscriptionEntries, subscriptionScale, '구독형 3개 · 확대 축');
const allocationSummary = `월 $${allocation.monthlyUsd} ÷ (${allocation.daysPerMonth}일 × 하루 ${allocation.windowsPerDay}개) = ${allocation.windowHours}시간 윈도우당 약 ${formatUsd(windowUsd)} · 월 ${monthlyWindows}개를 모두 활용하는 가정`;
const allocationRows = subscriptionEntries.map(entry => `<tr><th scope="row">${escapeHtml(entry.environment.label + ' · ' + entry.title)}</th><td>${escapeHtml(entry.record.estimate.basis)}</td><td>${entry.record.estimate.windowEquivalent.toFixed(2)}개 × ($${allocation.monthlyUsd} / ${monthlyWindows})</td><td>약 ${formatUsd(entry.record.estimate.usd)}</td></tr>`).join('');

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
  const timed = members.filter((entry) => entry.buildMs != null);
  const timeText = timed.length
    ? `${formatSpan(Math.min(...timed.map((entry) => entry.buildMs)))} ~ ${formatSpan(Math.max(...timed.map((entry) => entry.buildMs)))}`
    : '미수집';
  const models = members
    .map((entry) => `<li>${escapeHtml(entry.title)} · ${escapeHtml(entry.model)}</li>`)
    .join('\n            ');

  return `          <article class="env-card" style="--env:${environment.color}">
            <h3>${brandIcon(environment)}${escapeHtml(environment.label)}</h3>
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
    title: '기록된 개발 시간',
    sub: '개발 기록에 남은 시간, 미기록은 추정하지 않음',
    unit: '개발 시간',
    pick: (entry) => entry.buildMs,
    format: (value) => formatSpan(value),
    caption: 'Sol Fast는 기존 Sol 복제·수정 작업이다. Codex는 한도 중단·재개 전체를 포함하는지 불명확하다. Claude Code 두 건은 시간 미기록이다.',
  },
  {
    title: '코드 분량',
    sub: '빈 줄을 뺀 TS·JS·CSS·HTML 라인, 주석·테스트 포함',
    unit: '코드 LOC',
    pick: (entry) => entry.codeLoc,
    format: (value) => `${formatNumber(value)} LOC`,
    caption: '코드 확장자의 비공백 라인 수이며 주석·테스트도 포함한다. 많다고 좋은 것은 아니며 구조 선택의 차이를 보여 준다.',
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
        iconPath: brandPath(entry.environment),
        bounded: definition.pick === chartDefinitions[0].pick ? entry.buildBounded : false,
      }));
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
    `          <span style="color:${environment.color}">${brandIcon(environment)}${escapeHtml(environment.label)}</span>`,
).join('\n');

const implCards = entries
  .map((entry) => {
    const image = `<img src="/${escapeHtml(entry.thumb)}" alt="${escapeHtml(entry.environment.label + ' · ' + entry.title)} 대국 화면" loading="lazy" width="1200" height="750" />`;
    const shot = entry.thumb
      ? `<a class="impl-shot" href="/${escapeHtml(entry.thumb)}" target="_blank" rel="noopener" aria-label="${escapeHtml(entry.title)} 스크린샷 원본 새 탭에서 보기">${image}</a>`
      : '<div class="impl-shot missing">화면 캡처 준비 중</div>';
    const themeTag = entry.themeAware ? '<span class="tag-theme">다크 모드도 지원</span>' : '';
    const time = entry.buildMs
      ? `<dd>${entry.buildBounded ? '≤ ' : ''}${escapeHtml(formatSpan(entry.buildMs))}<span class="src">${escapeHtml(entry.buildSource)}${entry.buildBounded ? ' · 상한' : ''}</span></dd>`
      : '<dd class="pending">미수집</dd>';
    const tests = entry.testCases == null ? '<dd class="pending">미수집</dd>' : `<dd>${formatNumber(entry.testCases)}개</dd>`;
    const bundle = entry.bundleKb == null ? '<dd class="pending">미수집</dd>' : `<dd>${formatNumber(Math.round(entry.bundleKb))} kB</dd>`;

    return `          <article class="impl" id="result-${entry.dir}" data-project="${entry.dir}" data-env="${entry.environment.id}" style="--env:${entry.environment.color}">
            ${shot}
            <div class="impl-body">
              <div class="tags">
                <span class="env-tag">${brandIcon(entry.environment)}${escapeHtml(entry.environment.label)}</span>
                ${themeTag}
              </div>
              <h3>${escapeHtml(entry.title)}</h3>
              <p class="model">${escapeHtml(entry.environment.label)} - ${escapeHtml(entry.model)}</p>
              <p class="description">${escapeHtml(entry.desc)}</p>
              <p class="build-note">${escapeHtml(entry.record.note)}</p>
              <dl>
                <div><dt>코드</dt><dd>${formatNumber(entry.codeLoc)} LOC</dd></div>
                <div><dt>통과 테스트</dt>${tests}</div>
                <div><dt>기록된 개발 시간</dt>${time}</div>
                <div><dt>번들 JS</dt>${bundle}</div>
              </dl>
              <footer>
                <a class="app-link" href="${escapeHtml(entry.href)}">앱 열기 &rarr;</a>
                <a href="/comparison/logs/${escapeHtml(entry.dir)}.txt">개발 기록</a>
              </footer>
            </div>
          </article>`;
  })
  .join('\n');

const resourceLinks = [
  { href: '/comparison/', title: '전체 지표 표', desc: '폴더·파일·라인·문자·코드량과 파일 활동 시간을 한 표에서 확인' },
  { href: '/comparison/details.html', title: '기존 7종 심층 리포트', desc: '요구사항 충족도, 규칙 정확도(perft), 사용량 분석' },
  { href: '/comparison/#process', title: '전체 개발 기록', desc: '10개 결과물의 사용량·시간 기록과 확보된 원문 로그' },
  { href: '/comparison/project-size-time-report.txt', title: '측정 원문', desc: '규모와 시간 측정 결과를 생성한 그대로' },
]
  .map(
    (link) =>
      `          <a class="resource" href="${escapeHtml(link.href)}"><strong>${escapeHtml(link.title)}</strong><span>${escapeHtml(link.desc)}</span></a>`,
  )
  .join('\n');

const timeGaps = entries.filter((entry) => entry.buildMs == null).map((entry) => entry.title);
const usageGaps = [...processLogs.values()].filter((log) => log.usage === '미기록' || log.steps === '미기록');
const methodGaps = [
  timeGaps.length ? `작업 시간 ${timeGaps.map((title) => `${title}`).join(', ')}` : null,
  usageGaps.length ? `사용량·단계 ${usageGaps.map((log) => log.name).join(', ')}` : null,
]
  .filter(Boolean)
  .join(' / ');
const measurableCount = stats.projects.filter((project) => !project.copiedBaseline).length;
const methodTime = '개발 당시 기록과 사용자 제공 값을 사용합니다. 파일 복사로 평탄화된 생성 시각을 세션 시간으로 대신하지 않습니다. Claude Code의 5시간은 사용량 집계 윈도우이며 개발 소요 시간이 아닙니다.';

const analyzedAt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: stats.timeZone,
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(stats.generatedAt));
const builtAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const shotViewport = thumbnails ? `${thumbnails.viewport.width}×${thumbnails.viewport.height}` : '동일 뷰포트';

if (existsSync(thumbsDir)) cpSync(thumbsDir, join(outDir, 'thumbs'), { recursive: true });

const portalHtml = readFileSync(join(here, 'portal.template.html'), 'utf8')
  .replace('<!--COST_CHARTS-->', costCharts)
  .replace('<!--ALLOCATION_SUMMARY-->', escapeHtml(allocationSummary))
  .replace('<!--ALLOCATION_ROWS-->', allocationRows)
  .replace('<!--COMPARISON_ROWS-->', comparisonRows)
  .replace('<!--RECORD_DATE-->', escapeHtml(developmentData.recordedAt))
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
              <a href="${escapeHtml(entry.href)}">대국 시작</a>
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
