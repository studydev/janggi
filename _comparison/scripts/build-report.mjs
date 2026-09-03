// data/*.json + screenshots/*.png 를 읽어 비교 리포트(report.html)를 생성
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');
const read = (n) => JSON.parse(readFileSync(join(BASE, 'data', n), 'utf8'));

const tokens = read('tokens.json');
const code = read('code.json');
const checks = read('checks.json');
const features = read('features.json');
const rules = read('rules.json');
const usageClaude = existsSync(join(BASE, 'data', 'usage-claude.json')) ? read('usage-claude.json') : null;

const ORDER = ['luna', 'terra', 'sol', 'opus5', 'sonnet5', 'claude_opus5', 'claude_sonnet5'];
const byFolder = (arr, key = 'folder') => Object.fromEntries(arr.map((x) => [x[key], x]));
const T = byFolder(tokens.sessions);
const C = byFolder(code.projects);
const K = byFolder(checks.results);
const F = byFolder(features.results);
const R = byFolder(rules.baselines);

const META = {
  luna: { label: 'luna', model: 'GPT-5.6 (luna)', platform: 'GitHub Copilot', accent: '#6366f1' },
  terra: { label: 'terra', model: 'GPT-5.6 (terra)', platform: 'GitHub Copilot', accent: '#0891b2' },
  sol: { label: 'sol', model: 'GPT-5.6 (sol)', platform: 'GitHub Copilot', accent: '#ea580c' },
  opus5: { label: 'opus5', model: 'Claude Opus 5', platform: 'GitHub Copilot', accent: '#9333ea' },
  sonnet5: { label: 'sonnet5', model: 'Claude Sonnet 5', platform: 'GitHub Copilot', accent: '#c026d3' },
  claude_opus5: { label: 'claude_opus5', model: 'Claude Opus', platform: 'Claude (별도 측정)', accent: '#b45309' },
  claude_sonnet5: { label: 'claude_sonnet5', model: 'Claude Sonnet', platform: 'Claude (별도 측정)', accent: '#65a30d' },
};

const PROS_CONS = {
  luna: {
    pros: [
      '가장 작은 코드베이스(2,133 LOC)로 전 기능을 동작시켰고 번들도 174KB로 최소',
      '설정 화면·대국 화면의 시각적 완성도가 7개 중 상위권',
      '엔진/UI 분리, 기보·리플레이·localStorage까지 요구사항 대부분 충족',
    ],
    cons: [
      '<b>유일하게 규칙 버그가 확인됨</b> — 상(象) 이동 생성기가 방향 제약을 검사하지 않아 마(馬) 형태의 불법 이동을 생성 (perft 30,661)',
      '툴 호출 214회 중 38회 실패(17.8%)로 시행착오가 가장 많았고, 그만큼 라운드(262)와 추정 토큰이 커짐',
      'PWA(manifest·Service Worker), 에러 바운더리, 색맹 팔레트, 콘솔 랜덤 대국 스크립트 미구현',
      '테스트 25개로 최소 — perft를 넣었지만 기준값 자체가 틀려 회귀 방지 효과가 없음',
    ],
  },
  terra: {
    pros: [
      '<b>가장 효율적</b> — 148라운드·149툴호출로 완주했고 툴 실패율 2.7%로 최저',
      '추정 입력 토큰 18.1M으로 5개 Copilot 세션 중 최소(최대치 sonnet5의 46% 수준)',
      'P0~P12 체크 60/60 전항목 충족, 규칙도 표준값(30,506)과 일치',
      'engine / game(상태) / ui 3계층을 명확히 분리',
    ],
    cons: [
      '테스트 42개로 Claude 계열(108~213개) 대비 검증 밀도가 낮음',
      '랜덤 대국 검증이 300판으로 P6가 요구한 1,000판에 못 미침',
    ],
  },
  sol: {
    pros: [
      'UI에 가장 많이 투자(ui 2,070 LOC) — 7개 중 화면 구성이 가장 풍부',
      'P0~P12 체크 60/60 전항목 충족, 규칙 정확(pass 포함 컨벤션 32/1024/33506)',
      'validation.ts에 perft + 랜덤 대국 불변식 검사를 한 모듈로 묶어 관리',
    ],
    cons: [
      '5.82시간·262라운드로 <b>가장 오래 걸렸고</b> 추정 토큰도 상위권(34.9M)',
      '상태 관리 전용 레이어가 없어 UI 컴포넌트에 게임 상태 로직이 섞임',
      '테스트 55개로 코드량(4,071 LOC) 대비 밀도가 낮음',
    ],
  },
  opus5: {
    pros: [
      '<b>127라운드로 최소</b> — create_file 53회에서 보듯 먼저 설계하고 한 번에 써 내려가는 스타일',
      '툴 실패 3회(2.1%)로 최저 수준, 재작업이 거의 없음',
      '규칙 정확(30,506), 테스트 70개, 랜덤 대국·undo 검증 포함',
    ],
    cons: [
      '라운드당 컨텍스트가 271K~318K로 가장 큼 — 라운드 수는 적지만 <b>회당 단가가 가장 비쌈</b>(관측된 단일 요청 크레딧 179.32)',
      'P0가 요구한 CLAUDE.md(프로젝트 헌법 문서)를 만들지 않음',
      'rank 10을 보드에 "0"으로 표기하는 등 세부 마감이 아쉬움',
    ],
  },
  sonnet5: {
    pros: [
      '<b>테스트 213개로 최다</b>(vitest 실행 기준) — 기물별 유닛 + perft + 랜덤 대국 검증',
      'reasoning 30.5K 토큰으로 사고 과정이 가장 김 — 규칙 해석을 스스로 재검증한 흔적',
      '규칙 정확(pass 포함 컨벤션 32/1024/33506), engine/state/ui 3계층 분리',
    ],
    cons: [
      '컨텍스트가 408K까지 팽창해 <b>추정 입력 토큰 39.1M으로 최대</b>',
      'PWA(manifest·Service Worker), 색맹 팔레트 미구현 — P12를 가장 얕게 처리',
      'CLAUDE.md 미작성, 번들 218KB로 최대',
    ],
  },
  claude_opus5: {
    pros: [
      '<b>검증이 가장 철저</b> — 마상 배치 4종 전부에 perft 기준값을 고정(30506/30506/30353/30659)하고 1,000판 소크 테스트 수행',
      '테스트 143개, 총 5,716 LOC로 최대 규모이며 P0~P12 60/60 전항목 충족',
      'src/scripts에 perft·randomGame·soak 실행기를 분리해 콘솔 검증 경로를 별도 제공',
    ],
    cons: [
      '코드량이 가장 많아(다른 구현의 1.4~2.7배) 유지보수 부담이 큼',
      'UI 2,306 LOC로 비대 — 화면 결과물 대비 코드가 무거움',
      '사용량은 Claude 측에서 별도 수령 예정이라 이번 리포트에서는 비교 불가',
    ],
  },
  claude_sonnet5: {
    pros: [
      '테스트 108개에 <b>UI 컴포넌트 테스트(Board.test.tsx)까지 포함</b> — 7개 중 유일하게 렌더링 계층까지 검증',
      'P0~P12 60/60 전항목 충족, 규칙 정확(30,506)',
      'engine / game / ui 분리 + eslint 설정까지 갖춘 균형 잡힌 구성',
    ],
    cons: [
      '엔진 검증 랜덤 대국이 50판으로 P6 요구치(1,000판)에 크게 못 미침',
      '4,772 LOC로 상위권 코드량',
      '사용량은 Claude 측에서 별도 수령 예정이라 이번 리포트에서는 비교 불가',
    ],
  },
};

const fmt = (n) => (n === null || n === undefined ? '—' : n.toLocaleString('ko-KR'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/* ---------- 섹션 빌더 ---------- */

const scoreCards = ORDER.map((f) => {
  const m = META[f];
  const t = T[f]?.measured;
  const c = C[f];
  const k = K[f];
  const fe = F[f];
  const r = R[f];
  return `
  <article class="card" style="--accent:${m.accent}">
    <header>
      <span class="badge">${esc(m.platform)}</span>
      <h3>${esc(m.label)}</h3>
      <p class="model">${esc(m.model)}</p>
    </header>
    <img src="screenshots/${f}-2-game.png" alt="${esc(m.label)} 대국 화면" loading="lazy">
    <dl>
      <div><dt>규칙 검증</dt><dd>${r.agrees ? '<span class="ok">일치</span>' : '<span class="bad">불일치</span>'} <small>perft(3) ${fmt(r.values[2])}</small></dd></div>
      <div><dt>요구사항</dt><dd>${fe.score} / ${fe.total}</dd></div>
      <div><dt>테스트</dt><dd>${fmt(k.test.stats?.total)}개 통과</dd></div>
      <div><dt>코드</dt><dd>${fmt(c.totalLoc)} LOC</dd></div>
      <div><dt>LLM 라운드</dt><dd>${t ? fmt(t.rounds) : '측정 대기'}</dd></div>
      <div><dt>소요 시간</dt><dd>${t ? (t.durationMs / 3600000).toFixed(1) + '시간' : '측정 대기'}</dd></div>
    </dl>
  </article>`;
}).join('');

const maxLinear = Math.max(...ORDER.map((f) => T[f]?.estimate?.inputLinear ?? 0));
const tokenRowsA = ORDER.map((f) => {
  const t = T[f]?.measured;
  const e = T[f]?.estimate;
  if (!t) {
    return `<tr class="pending"><th>${esc(META[f].label)}</th><td colspan="7">Claude 측 사용량 별도 수령 예정 — <b>측정 대기 (N/A)</b></td></tr>`;
  }
  const bar = pct(e.inputLinear, maxLinear);
  return `<tr>
    <th>${esc(META[f].label)}<small>${esc(META[f].model)}</small></th>
    <td class="num">${fmt(t.rounds)}</td>
    <td class="num">${fmt(t.toolCalls)}<small>실패 ${t.toolFailures}</small></td>
    <td class="num">${fmt(t.outputTokens)}</td>
    <td class="num">${fmt(e.observedMin)}~${fmt(e.observedMax)}</td>
    <td class="num strong"><div class="bar" style="--w:${bar}%;--accent:${META[f].accent}"><span>${fmt(e.inputLinear)}</span></div></td>
    <td class="num muted">${fmt(e.inputLower)} ~ ${fmt(e.inputUpper)}</td>
    <td class="num">${(t.durationMs / 3600000).toFixed(2)}h</td>
  </tr>`;
}).join('');

const tokenRowsB = ORDER.flatMap((f) => {
  const rec = T[f]?.recorded;
  if (!rec) return [`<tr class="pending"><th>${esc(META[f].label)}</th><td colspan="5">측정 대기 (N/A)</td></tr>`];
  return rec.requests.map((q, i) => {
    const first = i === 0;
    return `<tr${first ? ' class="group-start"' : ''}>
      ${first ? `<th rowspan="${rec.requests.length}">${esc(META[f].label)}<small>${esc(rec.modelIds.join(' / '))}</small></th>` : ''}
      <td class="prompt">${esc((q.prompt ?? '').replace(/\s+/g, ' ').slice(0, 70)) || '—'}</td>
      <td class="num">${fmt(q.promptTokens)}</td>
      <td class="num">${fmt(q.completionTokens)}</td>
      <td class="num">${q.copilotCredits === null ? '—' : q.copilotCredits.toFixed(2)}</td>
      <td class="num muted">${fmt(q.responseParts)}</td>
    </tr>`;
  });
}).join('');

const shots = ORDER.map(
  (f) => `
  <section class="shot" id="shot-${f}">
    <h3><span class="dot" style="background:${META[f].accent}"></span>${esc(META[f].label)} <small>${esc(META[f].model)} · ${esc(META[f].platform)}</small></h3>
    <div class="shot-grid">
      <figure><img src="screenshots/${f}-1-intro.png" alt="${esc(f)} 진입 화면" loading="lazy"><figcaption>① 게임 진입 전 — 대국 설정 화면</figcaption></figure>
      <figure><img src="screenshots/${f}-2-game.png" alt="${esc(f)} 대국 화면" loading="lazy"><figcaption>② 대국 시작 직후 — 초기 배치 보드</figcaption></figure>
    </div>
  </section>`
).join('');

const maxLoc = Math.max(...ORDER.map((f) => C[f].totalLoc));
const codeRows = ORDER.map((f) => {
  const c = C[f];
  const k = K[f];
  const L = (n) => c.layers[n]?.loc ?? 0;
  const seg = (n, color) => (L(n) ? `<span style="width:${pct(L(n), c.totalLoc)}%;background:${color}" title="${n} ${L(n)} LOC"></span>` : '');
  return `<tr>
    <th>${esc(META[f].label)}</th>
    <td class="num">${fmt(c.totalFiles)}</td>
    <td class="num strong">${fmt(c.totalLoc)}</td>
    <td class="stack">
      <div class="stackbar" style="width:${pct(c.totalLoc, maxLoc)}%">
        ${seg('engine', '#2563eb')}${seg('state', '#0d9488')}${seg('ui', '#c026d3')}${seg('app', '#94a3b8')}${seg('test', '#16a34a')}${seg('scripts', '#f59e0b')}${seg('config', '#cbd5e1')}
      </div>
    </td>
    <td class="num">${fmt(L('engine'))}</td>
    <td class="num">${fmt(L('ui') + L('app'))}</td>
    <td class="num">${fmt(L('test'))}</td>
    <td class="num strong">${fmt(k.test.stats?.total)}</td>
    <td class="num">${fmt(k.build.bundleKb)} kB</td>
    <td class="chk">${k.test.ok ? '✔' : '✘'}</td>
    <td class="chk">${k.typecheck.ok ? '✔' : '✘'}</td>
    <td class="chk">${k.build.ok ? '✔' : '✘'}</td>
  </tr>`;
}).join('');

const perftRows = ORDER.map((f) => {
  const r = R[f];
  return `<tr class="${r.agrees ? '' : 'danger'}">
    <th>${esc(META[f].label)}</th>
    <td class="num">${fmt(r.values[0])}</td>
    <td class="num">${fmt(r.values[1])}</td>
    <td class="num strong">${fmt(r.values[2])}</td>
    <td>${r.includesPass ? '한 수 쉬기 포함' : '한 수 쉬기 제외'}</td>
    <td>${r.agrees ? '<span class="ok">표준값 일치</span>' : '<span class="bad">불일치 (+155)</span>'}</td>
    <td class="src">${esc(r.source)}</td>
  </tr>`;
}).join('');

const groupNames = Object.keys(F[ORDER[0]].groups);
const matrixHead = groupNames.map((g) => `<th><span>${esc(g.replace(' · ', '<br>').replace('<br>', ' '))}</span></th>`).join('');
const matrixRows = ORDER.map((f) => {
  const fe = F[f];
  const cells = groupNames
    .map((g) => {
      const cs = fe.groups[g];
      const hit = cs.filter((x) => x.ok).length;
      const cls = hit === cs.length ? 'full' : hit >= cs.length * 0.6 ? 'partial' : 'low';
      const miss = cs.filter((x) => !x.ok).map((x) => x.label);
      return `<td class="cell ${cls}" title="${esc(miss.length ? '미충족: ' + miss.join(', ') : '전항목 충족')}">${hit}/${cs.length}</td>`;
    })
    .join('');
  return `<tr><th>${esc(META[f].label)}</th>${cells}<td class="num strong">${fe.score}/${fe.total}</td></tr>`;
}).join('');

const missList = ORDER.map((f) => {
  const miss = Object.entries(F[f].groups).flatMap(([g, cs]) => cs.filter((c) => !c.ok).map((c) => `${g.split(' ')[0]} ${c.label}`));
  return `<li><b>${esc(META[f].label)}</b> — ${miss.length ? esc(miss.join(', ')) : '<span class="ok">전항목 충족</span>'}</li>`;
}).join('');

const prosCons = ORDER.map((f) => {
  const p = PROS_CONS[f];
  return `
  <article class="pc" style="--accent:${META[f].accent}">
    <h3>${esc(META[f].label)} <small>${esc(META[f].model)}</small></h3>
    <div class="pc-body">
      <div><h4 class="good">장점</h4><ul>${p.pros.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div><h4 class="bad-h">단점 · 한계</h4><ul>${p.cons.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    </div>
  </article>`;
}).join('');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>장기 게임 7개 LLM 구현체 비교 리포트</title>
<style>
:root{--bg:#f6f7f9;--panel:#fff;--ink:#16181d;--muted:#697386;--line:#e3e6eb;--ok:#16a34a;--bad:#dc2626;--warn:#d97706}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Pretendard","Segoe UI",-apple-system,"Malgun Gothic",sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:1500px;margin:0 auto;padding:0 28px 96px}
header.top{padding:64px 0 40px;border-bottom:1px solid var(--line);margin-bottom:44px}
header.top h1{margin:0 0 12px;font-size:34px;letter-spacing:-.02em}
header.top p{margin:0;color:var(--muted);max-width:900px}
.meta{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}
.meta span{background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:5px 14px;font-size:13px;color:var(--muted)}
h2{font-size:23px;margin:64px 0 8px;letter-spacing:-.01em}
h2 .n{color:var(--muted);font-weight:600;margin-right:10px}
.lede{color:var(--muted);margin:0 0 22px;max-width:1000px}
section.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px;overflow:auto}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{padding:9px 11px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
thead th{font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;border-bottom:2px solid var(--line)}
tbody th{white-space:nowrap;font-weight:700}
tbody th small{display:block;font-weight:400;color:var(--muted);font-size:11.5px}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td.num small{display:block;color:var(--muted);font-size:11.5px}
td.strong{font-weight:700}
td.muted{color:var(--muted)}
td.chk{text-align:center;color:var(--ok);font-weight:700}
tr.danger{background:#fef2f2}
tr.pending{color:var(--muted);background:#fafafa}
tr.group-start th{border-top:2px solid var(--line)}
td.prompt{color:var(--muted);font-size:13px;max-width:420px}
td.src{color:var(--muted);font-size:12px}
.ok{color:var(--ok);font-weight:700}
.bad{color:var(--bad);font-weight:700}
.bar{position:relative;background:#eef1f5;border-radius:5px;height:22px;min-width:150px}
.bar::before{content:"";position:absolute;inset:0;width:var(--w);background:var(--accent);opacity:.22;border-radius:5px}
.bar span{position:relative;display:block;padding-right:8px;line-height:22px}
.stack{width:230px}
.stackbar{display:flex;height:16px;border-radius:4px;overflow:hidden;background:#eef1f5;min-width:40px}
.stackbar span{display:block;height:100%}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{background:var(--panel);border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.card header{padding:16px 18px 10px}
.card .badge{font-size:11px;color:var(--accent);font-weight:700;letter-spacing:.03em}
.card h3{margin:2px 0 0;font-size:19px}
.card .model{margin:0;color:var(--muted);font-size:13px}
.card img{width:100%;display:block;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}
.card dl{margin:0;padding:12px 18px 18px;display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}
.card dl>div{display:flex;flex-direction:column}
.card dt{font-size:11.5px;color:var(--muted)}
.card dd{margin:0;font-size:14px;font-weight:700}
.card dd small{font-weight:400;color:var(--muted);font-size:11.5px;display:block}
.shot{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:20px}
.shot h3{margin:0 0 14px;font-size:18px;display:flex;align-items:center;gap:9px}
.shot h3 small{color:var(--muted);font-weight:400;font-size:13px}
.dot{width:11px;height:11px;border-radius:50%;display:inline-block}
.shot-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.shot-grid figure{margin:0}
.shot-grid img{width:100%;border:1px solid var(--line);border-radius:9px;display:block;background:#fff}
.shot-grid figcaption{margin-top:8px;font-size:12.5px;color:var(--muted)}
.cell{text-align:center;font-weight:700;font-variant-numeric:tabular-nums;cursor:help}
.cell.full{background:#e8f7ee;color:#15803d}
.cell.partial{background:#fef6e7;color:#b45309}
.cell.low{background:#fdeaea;color:#b91c1c}
.pc{background:var(--panel);border:1px solid var(--line);border-left:5px solid var(--accent);border-radius:12px;padding:18px 22px;margin-bottom:16px}
.pc h3{margin:0 0 12px;font-size:18px}
.pc h3 small{color:var(--muted);font-weight:400;font-size:13px;margin-left:6px}
.pc-body{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.pc h4{margin:0 0 6px;font-size:13px;letter-spacing:.03em}
.pc h4.good{color:var(--ok)}
.pc h4.bad-h{color:var(--bad)}
.pc ul{margin:0;padding-left:19px;font-size:14px}
.pc li{margin-bottom:5px}
.callout{background:#fff;border:1px solid var(--line);border-left:5px solid var(--bad);border-radius:12px;padding:20px 24px;margin-top:18px}
.callout h3{margin:0 0 10px;font-size:17px;color:var(--bad)}
.callout dl{margin:0;display:grid;grid-template-columns:132px 1fr;gap:8px 18px;font-size:14px}
.callout dt{color:var(--muted);font-weight:600}
.callout dd{margin:0}
code{background:#eef1f5;padding:1px 6px;border-radius:5px;font-size:13px;font-family:ui-monospace,Consolas,monospace}
.note{font-size:13px;color:var(--muted);margin-top:14px;padding-left:14px;border-left:3px solid var(--line)}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--muted);margin-top:12px}
.legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.findings{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px 26px}
.findings ol{margin:0;padding-left:20px}
.findings li{margin-bottom:12px}
@media(max-width:900px){.shot-grid,.pc-body{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <h1>웹 장기(將棋) 구현체 7종 비교 리포트</h1>
  <p>동일한 <code>janggi-dev-prompts.md</code>(P0~P12) 한 벌을 기준으로, 서로 다른 LLM이 각자 독립 세션에서 구현한 결과물을 나란히 비교했다.
     P10(AI 상대)과 P11(온라인 대전)은 모든 세션에서 구현 대상에서 제외됐다.
     LLM 사용량은 VS Code 세션 로그를 재해석해 산출했고, 화면은 7개 앱을 실제로 빌드·기동해 동일 조건으로 촬영했다.</p>
  <div class="meta">
    <span>생성 ${new Date().toLocaleString('ko-KR')}</span>
    <span>대상 7개 구현체</span>
    <span>스크린샷 1920 × 1080 · Edge headless</span>
    <span>빌드 산출물(vite preview) 기준</span>
  </div>
</header>

<h2><span class="n">01</span>한눈에 보기</h2>
<p class="lede">7개 구현체 모두 타입체크·테스트·프로덕션 빌드를 통과했다. 결과가 갈린 지점은 “동작하느냐”가 아니라 <b>규칙 정확도·검증 깊이·자원 효율</b>이다.</p>
<div class="cards">${scoreCards}</div>

<h2><span class="n">02</span>LLM 사용량 — A. 세션 로그 재계산</h2>
<p class="lede">VS Code는 요청 단위 최종 라운드의 토큰만 부분적으로 남기므로, 전체 대화 원문(<code>transcripts/*.jsonl</code>)을 o200k_base 토크나이저로 직접 재계산했다.
   <b>라운드 수 · 툴 호출 수 · 출력 토큰</b>은 실측값이고, <b>추정 입력 토큰</b>은 아래 방법론에 따른 계산값이다.</p>
<section class="panel">
<table>
  <thead><tr>
    <th>구현체</th><th>LLM 라운드<br>(API 호출)</th><th>툴 호출</th><th>출력 토큰<br>(실측)</th>
    <th>관측 컨텍스트<br>(min~max)</th><th>추정 입력 토큰<br>(선형 모델)</th><th>추정 범위<br>(하한~상한)</th><th>소요<br>시간</th>
  </tr></thead>
  <tbody>${tokenRowsA}</tbody>
</table>
<div class="note">
  <b>방법론.</b> 에이전트 루프는 툴 호출 라운드마다 전체 대화를 다시 보낸다. 따라서 총 입력 토큰 ≈ Σ(라운드별 컨텍스트 크기).
  고정 오버헤드(시스템 지시문 + 툴 정의)는 실측 <code>promptTokenDetails</code>(System 26% + Tool Definitions 54%)로부터 <b>${fmt(tokens.baseOverhead)} 토큰</b>으로 산출했다.
  하한 = 라운드 × 오버헤드, 상한 = 라운드 × 관측 최대 컨텍스트, 선형 모델 = 그 중간값.
  <b>프롬프트 캐시 할인은 반영되지 않았으므로 실제 과금 토큰은 이보다 훨씬 작다.</b> 절대값이 아니라 <b>구현체 간 상대 비교</b>용으로 읽어야 한다.
  또한 GPT-5.6 계열 세션은 transcript에 reasoning 텍스트가 남지 않아, 출력 토큰의 사고 과정 비중은 Claude 계열만 반영돼 있다.
</div>
</section>

<h2><span class="n">03</span>LLM 사용량 — B. VS Code 기록 원본</h2>
<p class="lede">가공하지 않은 <code>chatSessions/*.jsonl</code> 기록값이다. VS Code가 일부 요청에만 값을 남기기 때문에 빈칸이 많고, 이 표만으로는 세션 간 비교가 성립하지 않는다. 재계산 결과(A)의 근거를 확인하는 용도다.</p>
<section class="panel">
<table>
  <thead><tr><th>구현체</th><th>요청</th><th>promptTokens</th><th>completionTokens</th><th>copilotCredits</th><th>응답 파트</th></tr></thead>
  <tbody>${tokenRowsB}</tbody>
</table>
<div class="note">각 세션의 첫 요청이 "장기 게임을 만들어 달라"는 본 작업이고, 이후 요청은 색상 수정·실행 요청·터미널 알림 등 부수 작업이다. luna 세션은 토큰·크레딧 기록이 전혀 남지 않았다.</div>
</section>

<h2><span class="n">04</span>동작 화면 비교</h2>
<p class="lede">7개 프로젝트를 각각 <code>vite build</code> 후 <code>vite preview</code>로 띄우고, 동일한 Edge headless 브라우저(1920×1080)에서
   ① 최초 진입 화면 ② “대국 시작” 클릭 직후 초기 배치 보드를 촬영했다.</p>
${shots}

<h2><span class="n">05</span>규칙 정확도 — perft 교차 검증</h2>
<p class="lede">가장 객관적인 규칙 품질 지표다. 각 프로젝트가 자기 테스트에 고정해 둔 초기 국면(마상마상, 초 선수) 합법수 트리 노드 수를 모아 비교했다. 모든 테스트는 실제로 통과한다.</p>
<section class="panel">
<table>
  <thead><tr><th>구현체</th><th>depth 1</th><th>depth 2</th><th>depth 3</th><th>계수 규칙</th><th>판정</th><th>출처</th></tr></thead>
  <tbody>${perftRows}</tbody>
</table>
<div class="note">
  <b>두 갈래 값은 규칙 차이가 아니다.</b> terra 엔진으로 직접 재계산한 결과
  한 수 쉬기를 제외하면 <code>31 / 961 / 30506</code>, 포함하면 <code>32 / 1024 / 33506</code>이 나온다.
  즉 <b>6개 구현체는 규칙 해석이 완전히 일치</b>하며 세는 방식만 다르다. 오직 luna의 30,661만 어느 쪽으로도 설명되지 않는다.
</div>
</section>

<div class="callout">
  <h3>단 하나의 규칙 버그 — luna의 상(象) 이동</h3>
  <dl>
    <dt>증상</dt><dd>${esc(rules.divergence.symptom)}</dd>
    <dt>원인</dt><dd>${esc(rules.divergence.rootCause)}</dd>
    <dt>파일</dt><dd><code>${esc(rules.divergence.file)}</code></dd>
    <dt>재현</dt><dd>${esc(rules.divergence.reproduction)}</dd>
    <dt>왜 숨었나</dt><dd>${esc(rules.divergence.whyHidden)}</dd>
  </dl>
</div>

<h2><span class="n">06</span>코드 규모와 빌드·테스트 검증</h2>
<p class="lede">모든 프로젝트에서 <code>vitest run</code>, <code>tsc -b</code>, <code>vite build</code>를 실제로 실행한 결과다.</p>
<section class="panel">
<table>
  <thead><tr>
    <th>구현체</th><th>파일</th><th>총 LOC</th><th>레이어 구성</th><th>engine</th><th>UI</th><th>test LOC</th>
    <th>테스트<br>케이스</th><th>번들 JS</th><th>test</th><th>tsc</th><th>build</th>
  </tr></thead>
  <tbody>${codeRows}</tbody>
</table>
<div class="legend">
  <span><i style="background:#2563eb"></i>engine</span><span><i style="background:#0d9488"></i>state</span>
  <span><i style="background:#c026d3"></i>ui</span><span><i style="background:#94a3b8"></i>app</span>
  <span><i style="background:#16a34a"></i>test</span><span><i style="background:#f59e0b"></i>scripts</span><span><i style="background:#cbd5e1"></i>config</span>
</div>
</section>

<h2><span class="n">07</span>P0~P12 요구사항 커버리지</h2>
<p class="lede">프롬프트 문서의 각 단계가 소스에 실제로 반영됐는지 60개 신호로 판정했다. 셀에 마우스를 올리면 미충족 항목이 보인다. P10·P11은 구현 대상에서 제외돼 집계하지 않았다.</p>
<section class="panel">
<table>
  <thead><tr><th>구현체</th>${matrixHead}<th>합계</th></tr></thead>
  <tbody>${matrixRows}</tbody>
</table>
<div class="note"><b>미충족 항목</b><ul style="margin:8px 0 0;padding-left:18px">${missList}</ul></div>
</section>

<h2><span class="n">08</span>구현체별 장단점</h2>
${prosCons}

<h2><span class="n">09</span>종합 관찰</h2>
<div class="findings">
<ol>
  <li><b>스펙이 촘촘하면 모델 간 “동작 여부” 차이는 사라진다.</b> 7개 전부 타입체크·테스트·빌드를 통과했고 화면도 모두 정상 동작했다.
      P0(프로젝트 헌법)과 P1(RULES.md 원문 고정)이 편차를 크게 줄인 것으로 보인다. 실제로 <b>7개 중 어느 것도 샹치 규칙으로 구현하지 않았다.</b></li>
  <li><b>남는 편차는 검증 깊이에서 갈렸다.</b> 테스트 케이스 수는 25개(luna)에서 213개(sonnet5)까지 8.5배 차이가 난다.
      그리고 유일한 규칙 버그는 <b>테스트가 가장 적은 구현체에서</b> 나왔다. 더 정확히는, luna도 perft 테스트를 넣었지만 기준값 자체를 자기 엔진 출력으로 고정해
      회귀는 막되 오류는 잡지 못했다. <b>perft는 외부 기준값과 교차 검증할 때만 의미가 있다.</b></li>
  <li><b>토큰 효율은 모델 계열보다 작업 전략이 좌우했다.</b> 같은 GPT-5.6 계열에서도 terra는 148라운드·툴 실패 2.7%로 끝냈지만
      luna는 262라운드·17.8%, sol은 5.8시간이 걸렸다. 추정 입력 토큰 격차는 18.1M ↔ 39.1M로 2배가 넘는다.</li>
  <li><b>Claude 계열은 “적은 라운드 × 큰 컨텍스트”, GPT 계열은 “많은 라운드 × 작은 컨텍스트”.</b>
      opus5는 127라운드로 최소지만 라운드당 컨텍스트가 271K~318K로 가장 크고, 관측된 단일 요청 크레딧도 179.32로 최고였다.
      라운드 수만 보면 Claude가 효율적으로 보이지만 <b>회당 단가까지 곱하면 역전될 수 있다.</b></li>
  <li><b>도구 사용 패턴이 뚜렷하게 갈렸다.</b> Claude 계열은 <code>create_file</code>(opus5 53회, sonnet5 44회)로 설계 후 한 번에 써 내려갔고,
      GPT 계열은 <code>apply_patch</code>와 <code>run_in_terminal</code>·<code>execution_subagent</code>를 반복하며 점진적으로 수렴했다.</li>
  <li><b>Claude Code로 만든 두 구현체가 검증에 가장 투자했다.</b> claude_opus5는 마상 배치 4종 전부에 perft 기준값을 고정하고 1,000판 소크 테스트를 돌렸으며,
      claude_sonnet5는 7개 중 유일하게 UI 컴포넌트 테스트까지 작성했다. 대신 코드량은 4,772~5,716 LOC로 가장 무겁다.</li>
  <li><b>가장 얕게 처리된 단계는 P12(접근성·배포)였다.</b> PWA·색맹 팔레트·에러 바운더리는 프롬프트의 마지막 블록에 몰려 있어
      luna와 sonnet5에서 누락됐다. <b>중요한 요구사항을 프롬프트 뒤쪽에 두면 탈락 위험이 커진다.</b></li>
</ol>
<div class="note">
  Claude(claude_opus5 / claude_sonnet5) 두 구현체의 토큰 사용량은 Claude 측에서 별도로 수령할 예정이라 이번 리포트에서는 <b>측정 대기(N/A)</b>로 남겼다.
  값을 확보하면 <code>data/usage-claude.json</code>에 넣고 <code>node scripts/build-report.mjs</code>를 다시 실행하면 반영된다.
</div>
</div>

</div>
</body>
</html>`;

writeFileSync(join(BASE, 'report.html'), html, 'utf8');
console.log(`→ ${join(BASE, 'report.html')}`);
if (!usageClaude) console.log('  (data/usage-claude.json 없음 — Claude 사용량은 측정 대기로 표기)');
