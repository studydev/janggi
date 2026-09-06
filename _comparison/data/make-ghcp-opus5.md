# GitHub Copilot 개발 기록: Opus5

| 항목 | 값 |
| --- | --- |
| Model | Claude Opus5 (MAX 1M) |
| 도구 | GitHub Copilot |
| 프로젝트 | [opus5](../../opus5/) |
| Usage | 1,301.6 크레딧 |
| Time | 40분 36초 |
| Steps | 48 |
| Files | 54개 |
| Lines | 7,193줄 (텍스트 전체, 빈 줄 포함) |
| 코드 비공백 LOC | 3,682줄 |
| 규모 측정일 | 2026-09-06 |

시간·사용량·Steps는 제공된 기록을 유지했다. 파일·라인 수는 [공통 집계 기준](README.md#측정-기준)에 따른 현재 실측값이며, 개발 당시 편집량이 아니다.

## 개발 로그

<details>
<summary>원문 펼치기</summary>

~~~~text

할 일 목록 업데이트됨

Ran terminal command: node --version; npm --version

Read 

Node 24 확인. `opus5`에 프로젝트를 구성하겠습니다. 먼저 스캐폴딩과 규칙 명세부터 만듭니다. 

규칙 명세 고정 완료. 이제 엔진(P2)을 만듭니다. 

할 일 5개 생성함

이제 기물별 이동 생성기(P3)를 만듭니다.  

Replacing 22 lines with 10 lines in 
Replacing 1 lines with 1 lines in 
시작 중: *Create game rules module*(3/5)

합법수·장군 판정(P4)과 승패 판정(P5)을 만듭니다.   

Replacing 4 lines with 14 lines in 
엔진 테스트(P3~P6)를 작성합니다. 

할 일 목록 업데이트됨

Replacing 14 lines with 14 lines in ```
P6 검증 모듈과 스크립트를 만듭니다.  

의존성을 설치하고 엔진 테스트를 돌립니다.  

Execution complete: 의존성 설치 및 엔진 테스트 실행

Ran terminal command: Set-Location 'C:\Work\Azure\janggi\opus5'; Write-Output '=== npm install ==='; npm install; $installCode = $LASTEXITCODE; Write-Output "=== INSTALL_EXIT_CODE: $installCode ==="; if ($installCode -eq 0) { Write-Output '=== npx vitest run ==='; npx vitest run; $testCode = $LASTEXITCODE; Write-Output "=== TEST_EXIT_CODE: $testCode ==="; Write-Output '=== npx tsc --noEmit ==='; npx tsc --noEmit; $tscCode = $LASTEXITCODE; Write-Output "=== TSC_EXIT_CODE: $tscCode ===" }

터미널 출력 확인됨

설치가 진행되는 동안 UI(P7~P9, P12)를 작성합니다.  

Replacing 24 lines with 17 lines in 
시작 중: *Develop move generation logic*(4/9)

터미널 출력 확인됨

No matches found.

Read , lines 1 to 40

Replacing 12 lines with 12 lines in , 
Execution complete: vitest 3 재설치 후 테스트/타입체크

Ran terminal command: Set-Location 'C:\Work\Azure\janggi\opus5'; Write-Output '=== npm install ==='; npm install; $installCode = $LASTEXITCODE; Write-Output "=== INSTALL_EXIT_CODE: $installCode ==="; if ($installCode -eq 0) { Write-Output '=== npx vitest run ==='; npx vitest run; $testCode = $LASTEXITCODE; Write-Output "=== TEST_EXIT_CODE: $testCode ==="; Write-Output '=== npx tsc --noEmit ==='; npx tsc --noEmit; $tscCode = $LASTEXITCODE; Write-Output "=== TSC_EXIT_CODE: $tscCode ===" } else { Write-Output '=== tests/typecheck skipped because npm install failed ===' }

엔진 통과. perft 기준값 산출과 랜덤 1000판 검증을 실행합니다.   

Execution complete: perft 기준값 산출 + 랜덤 1000판 검증

Ran terminal command: Set-Location 'C:\Work\Azure\janggi\opus5'; npx tsx scripts/verify-engine.ts --games 1000 --depth 3

perft가 수기 계산(31수)과 일치합니다. 회귀 기준값을 테스트로 고정합니다.   

Replacing 8 lines with 8 lines in 
시작 중: *Build React UI components for game*(5/9)

Checked , , , , , , , , , , , no problems found

빌드와 전체 테스트를 돌립니다.   

Execution complete: 빌드 및 전체 테스트

Ran terminal command: Set-Location 'C:\Work\Azure\janggi\opus5'; Write-Output '=== npm run build ==='; npm run build 2>&1; $buildCode = $LASTEXITCODE; Write-Output "=== BUILD_EXIT_CODE: $buildCode ==="; if (Test-Path dist) { Write-Output '=== DIST_FILES ==='; Get-ChildItem dist -Recurse -File | ForEach-Object { $relative = $_.FullName.Substring((Resolve-Path dist).Path.Length + 1); '{0} {1} bytes' -f $relative, $_.Length } }; Write-Output '=== npx vitest run ==='; npx vitest run 2>&1; $testCode = $LASTEXITCODE; Write-Output "=== TEST_EXIT_CODE: $testCode ==="

Ran terminal command: Set-Location 'C:\Work\Azure\janggi\opus5'; npm run dev
`브라우저` 열림

Browser action failed

Browser action failed
Completed with input: await page.locator('button.btn--lg').click({ force: true, timeout: 3000 });
return await page.locator('.game__turn').innerText();

Browser action failed
Completed with input: await page.setViewportSize({ width: 1280, height: 900 });
await page.locator('button.btn--lg').click({ timeout: 5000 });
return await page.locator('.game__turn').innerText();

Browser action failed

`브라우저` 열림

Playwright 코드 실행함
Completed with input: return await page.evaluate(async () => {
  const samples = [];
  const btn = document.querySelector('button.btn--lg');
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    samples.push([
      document.documentElement.scrollHeight,
      document.documentElement.clientWidth,
      Math.round(btn.getBoundingClientRect().top),
      window.innerHeight,
    ]);
  }
  return JSON.stringify(samples);
});

Playwright 코드 대기 중

Browser action failed

`브라우저` 열림

Playwright 코드 실행함
Completed with input: return await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('대국 시작'));
  btn.click();
  return 'clicked';
});

Browser action failed

`브라우저` 열림

Browser action failed
Completed with input: await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('대국 시작')).click();
});
await page.waitForSelector('.board', { timeout: 5000 });
const shot = await page.screenshot({ path: 'C:/Work/Azure/janggi/opus5/.screens/game.png', fullPage: true });
return `bytes=${shot.length}`;

Playwright 코드 실행함
Completed with input: return await page.evaluate(() => {
  const b = document.querySelector('.board').getBoundingClientRect();
  const w = document.querySelector('.boardwrap').getBoundingClientRect();
  const g = document.querySelector('.game').getBoundingClientRect();
  return JSON.stringify({
    board: [b.x, b.y, b.width, b.height],
    wrap: [w.x, w.y, w.width, w.height],
    game: [g.width, g.height],
    win: [window.innerWidth, window.innerHeight],
    computed: getComputedStyle(document.querySelector('.board')).height,
  });
});

Replacing 10 lines with 12 lines in 
Browser action failed

`브라우저` 열림

Playwright 코드 실행함
Completed with input: const log = {};
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5175/', { waitUntil: 'load' });
await page.evaluate(() => {
  localStorage.clear();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('대국 시작')).click();
});
await page.waitForSelector('.board', { state: 'visible', timeout: 5000 });

const geo = await page.evaluate(() => {
  const r = document.querySelector('.board').getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
log.boardBox = [Math.round(geo.w), Math.round(geo.h)];
const VB_W = 572, VB_H = 632, UNIT = 60, MARGIN = 46;
const scale = Math.min(geo.w / VB_W, geo.h / VB_H);
const ox = geo.x + (geo.w - VB_W * scale) / 2;
const oy = geo.y + (geo.h - VB_H * scale) / 2;
const pt = (file, rank) => ({ x: ox + (MARGIN + (file - 1) * UNIT) * scale, y: oy + (MARGIN + (rank - 1) * UNIT) * scale });

// 1) 클릭으로 초 마 선택 -> 이동 지점 표시
let p = pt(2, 10);
await page.mouse.click(p.x, p.y);
log.targetsAfterSelect = await page.evaluate(() => document.querySelectorAll('.board__target, .board__capture').length);

// 2) 클릭으로 착수
p = pt(1, 8);
await page.mouse.click(p.x, p.y);
log.moveText1 = await page.evaluate(() => document.querySelector('.movelist__text')?.textContent ?? null);
log.turnAfter1 = await page.evaluate(() => document.querySelector('.badge')?.textContent ?? null);

// 3) 드래그 앤 드롭으로 한 병 전진 (1,4) -> (1,5)
const from = pt(1, 4), to = pt(1, 5);
await page.mouse.move(from.x, from.y);
await page.mouse.down();
await page.mouse.move(to.x, to.y, { steps: 8 });
await page.mouse.up();
log.moves = await page.evaluate(() => [...document.querySelectorAll('.movelist__text')].map((n) => n.textContent));
log.hanJol = await page.evaluate(() => !!document.querySelector('[aria-label="한 병, 5행 1열"]'));

// 4) 키보드 조작: 보드에 포커스 -> 방향키 -> Enter 로 선택
await page.locator('.boardwrap').focus();
await page.keyboard.press('ArrowUp');
log.cursorVisible = await page.evaluate(() => !!document.querySelector('.board__cursor'));

await page.screenshot({ path: 'C:/Work/Azure/janggi/opus5/.screens/game.png' });
return JSON.stringify(log);

Replacing 26 lines with 33 lines in 
Playwright 코드 실행함
Completed with input: const log = {};
await page.goto('http://localhost:5175/', { waitUntil: 'load' });
await page.evaluate(() => {
  localStorage.clear();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('대국 시작')).click();
});
await page.waitForSelector('.board', { state: 'visible', timeout: 5000 });

const geo = await page.evaluate(() => {
  const r = document.querySelector('.board').getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
const VB_W = 572, VB_H = 632, UNIT = 60, MARGIN = 46;
const scale = Math.min(geo.w / VB_W, geo.h / VB_H);
const ox = geo.x + (geo.w - VB_W * scale) / 2;
const oy = geo.y + (geo.h - VB_H * scale) / 2;
const pt = (file, rank) => ({ x: ox + (MARGIN + (file - 1) * UNIT) * scale, y: oy + (MARGIN + (rank - 1) * UNIT) * scale });

let p = pt(2, 10);
await page.mouse.click(p.x, p.y);
log.targets = await page.evaluate(() => document.querySelectorAll('.board__target, .board__capture').length);
p = pt(1, 8);
await page.mouse.click(p.x, p.y);
log.move1 = await page.evaluate(() => document.querySelector('.movelist__text')?.textContent ?? null);
log.turn = await page.evaluate(() => document.querySelector('.badge')?.textContent ?? null);

const from = pt(1, 4), to = pt(1, 5);
await page.mouse.move(from.x, from.y);
await page.mouse.down();
await page.mouse.move(to.x, to.y, { steps: 8 });
await page.mouse.up();
log.moves = await page.evaluate(() => [...document.querySelectorAll('.movelist__text')].map((n) => n.textContent));
log.hanJol5 = await page.evaluate(() => !!document.querySelector('[aria-label="한 병, 5행 1열"]'));
log.status = await page.evaluate(() => document.querySelector('.status')?.textContent ?? null);
return JSON.stringify(log);

Playwright 코드 실행함
Completed with input: const log = {};
await page.goto('http://localhost:5175/', { waitUntil: 'load' });
await page.evaluate(() => {
  localStorage.clear();
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('대국 시작')).click();
});
await page.waitForSelector('.board', { state: 'visible', timeout: 5000 });
await page.evaluate(() => document.querySelector('.board').scrollIntoView({ block: 'start' }));

const geo = await page.evaluate(() => {
  const r = document.querySelector('.board').getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight };
});
log.geo = [Math.round(geo.x), Math.round(geo.y), Math.round(geo.w), Math.round(geo.h), geo.vw, geo.vh];
const VB_W = 572, VB_H = 632, UNIT = 60, MARGIN = 46;
const scale = Math.min(geo.w / VB_W, geo.h / VB_H);
const ox = geo.x + (geo.w - VB_W * scale) / 2;
const oy = geo.y + (geo.h - VB_H * scale) / 2;
const pt = (file, rank) => ({ x: ox + (MARGIN + (file - 1) * UNIT) * scale, y: oy + (MARGIN + (rank - 1) * UNIT) * scale });

let p = pt(2, 10);
log.click1 = [Math.round(p.x), Math.round(p.y)];
await page.mouse.click(p.x, p.y);
log.targets = await page.evaluate(() => document.querySelectorAll('.board__target, .board__capture').length);
p = pt(1, 8);
await page.mouse.click(p.x, p.y);
log.move1 = await page.evaluate(() => document.querySelector('.movelist__text')?.textContent ?? null);
log.turn = await page.evaluate(() => document.querySelector('.badge')?.textContent ?? null);

const from = pt(1, 4), to = pt(1, 5);
await page.mouse.move(from.x, from.y);
await page.mouse.down();
await page.mouse.move(to.x, to.y, { steps: 8 });
await page.mouse.up();
log.moves = await page.evaluate(() => [...document.querySelectorAll('.movelist__text')].map((n) => n.textContent));
log.hanJol5 = await page.evaluate(() => !!document.querySelector('[aria-label="한 병, 5행 1열"]'));
log.status = await page.evaluate(() => document.querySelector('.status')?.textContent ?? null);
return JSON.stringify(log);

Playwright 코드 실행함
Completed with input: await page.evaluate(() => {
  window.__ev = [];
  const push = (e) => window.__ev.push(`${e.type}@${Math.round(e.clientX)},${Math.round(e.clientY)}->${e.target.tagName}.${e.target.getAttribute('class') || ''}`);
  for (const t of ['pointerdown', 'mousedown', 'click', 'pointerup']) window.addEventListener(t, push, true);
});
const geo = await page.evaluate(() => {
  const r = document.querySelector('.board').getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
const scale = Math.min(geo.w / 572, geo.h / 632);
const x = geo.x + (geo.w - 572 * scale) / 2 + (46 + 60) * scale;
const y = geo.y + (geo.h - 632 * scale) / 2 + (46 + 9 * 60) * scale;
await page.mouse.click(x, y);
return await page.evaluate((pt) => JSON.stringify({
  events: window.__ev,
  atPoint: (() => { const el = document.elementFromPoint(pt[0], pt[1]); return el ? `${el.tagName}.${el.getAttribute('class') || ''}` : null; })(),
  reactProps: !!document.querySelector('.board'),
}), [x, y]);

Playwright 코드 실행함
Completed with input: return await page.evaluate(() => {
  const board = document.querySelector('.board');
  const r = board.getBoundingClientRect();
  const scale = Math.min(r.width / 572, r.height / 632);
  const ox = r.x + (r.width - 572 * scale) / 2;
  const oy = r.y + (r.height - 632 * scale) / 2;
  const pt = (f, k) => ({ x: ox + (46 + (f - 1) * 60) * scale, y: oy + (46 + (k - 1) * 60) * scale });
  const fire = (type, p) => {
    const el = document.elementFromPoint(p.x, p.y) || board;
    el.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }));
  };
  const tap = (f, k) => { const p = pt(f, k); fire('pointerdown', p); fire('pointerup', p); };
  const out = {};

  tap(2, 10); // 초 마 선택
  out.targets = document.querySelectorAll('.board__target, .board__capture').length;
  out.selected = !!document.querySelector('.board__selected');
  return JSON.stringify(out);
});

Playwright 코드 실행함
Completed with input: const out = {};
const setup = () => page.evaluate(() => {
  const board = document.querySelector('.board');
  const r = board.getBoundingClientRect();
  const scale = Math.min(r.width / 572, r.height / 632);
  window.__pt = (f, k) => ({ x: r.x + (r.width - 572 * scale) / 2 + (46 + (f - 1) * 60) * scale, y: r.y + (r.height - 632 * scale) / 2 + (46 + (k - 1) * 60) * scale });
  window.__fire = (type, p) => {
    const el = document.elementFromPoint(p.x, p.y) || board;
    el.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }));
  };
  window.__tap = (f, k) => { const p = window.__pt(f, k); window.__fire('pointerdown', p); window.__fire('pointerup', p); };
});
await setup();

await page.evaluate(() => window.__tap(2, 10));
await page.waitForTimeout(250);
out.afterSelect = await page.evaluate(() => ({ targets: document.querySelectorAll('.board__target, .board__capture').length, selected: !!document.querySelector('.board__selected') }));

await page.evaluate(() => window.__tap(1, 8));
await page.waitForTimeout(250);
out.afterMove = await page.evaluate(() => ({
  move: document.querySelector('.movelist__text')?.textContent ?? null,
  turn: document.querySelector('.badge')?.textContent ?? null,
  ma: !!document.querySelector('[aria-label="초 마, 8행 1열"]'),
  status: document.querySelector('.status')?.textContent ?? null,
}));

// 드래그: 한 병 (1,4) -> (1,5)
await page.evaluate(() => {
  const a = window.__pt(1, 4), b = window.__pt(1, 5);
  window.__fire('pointerdown', a);
  window.__fire('pointermove', b);
  window.__fire('pointerup', b);
});
await page.waitForTimeout(250);
out.afterDrag = await page.evaluate(() => ({
  moves: [...document.querySelectorAll('.movelist__text')].map((n) => n.textContent),
  jol: !!document.querySelector('[aria-label="한 병, 5행 1열"]'),
}));
return JSON.stringify(out);

Playwright 코드 실행함
Completed with input: await page.screenshot({ path: 'C:/Users/hyounsookim/AppData/Local/Temp/janggi-game.png', fullPage: true });
return 'ok';

Viewed image 

Replacing 10 lines with 11 lines in , 
Playwright 코드 실행함
Completed with input: const out = {};
const clickBtn = (text) => page.evaluate((t) => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t || x.getAttribute('aria-label') === t);
  if (!b) return 'not found';
  b.click();
  return 'ok';
}, text);

out.pass = await clickBtn('한 수 쉬기');
await page.waitForTimeout(200);
out.afterPass = await page.evaluate(() => ({ status: document.querySelector('.status').textContent, last: [...document.querySelectorAll('.movelist__text')].pop()?.textContent }));

out.flip = await clickBtn('보드 뒤집기');
await page.waitForTimeout(200);
out.flipped = await page.evaluate(() => {
  const g = [...document.querySelectorAll('g[transform]')].find((n) => n.querySelector('[aria-label="초 초, 9행 5열"]'));
  return g ? g.getAttribute('transform') : null;
});

out.hangul = await clickBtn('한글 표기');
await page.waitForTimeout(200);
out.labels = await page.evaluate(() => document.querySelector('[aria-label="초 초, 9행 5열"] text').textContent);

out.cb = await clickBtn('색약 팔레트');
await page.waitForTimeout(200);
out.cbClass = await page.evaluate(() => document.querySelector('.board').getAttribute('class'));

out.prev = await clickBtn('이전 수');
await page.waitForTimeout(200);
out.replay = await page.evaluate(() => ({ status: document.querySelector('.status').textContent, interactive: !!document.querySelector('.board__cursor') }));

out.last = await clickBtn('마지막 국면');
await page.waitForTimeout(200);
out.backLive = await page.evaluate(() => document.querySelector('.status').textContent);

out.undo = await clickBtn('무르기');
await page.waitForTimeout(200);
out.afterUndo = await page.evaluate(() => [...document.querySelectorAll('.movelist__text')].map((n) => n.textContent));

out.saved = await page.evaluate(() => { const t = localStorage.getItem('janggi:autosave'); return t ? JSON.parse(t).moves.length : null; });
return JSON.stringify(out);

Playwright 코드 실행함
Completed with input: const out = {};
const clickBtn = (t) => page.evaluate((text) => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === text || x.getAttribute('aria-label') === text);
  if (!b) return 'not found';
  b.click();
  return 'ok';
}, t);

out.resign = await clickBtn('초 기권');
await page.waitForTimeout(250);
out.dialog = await page.evaluate(() => {
  const m = document.querySelector('.modal__box');
  return m ? m.innerText.replace(/\n+/g, ' | ') : null;
});
await page.screenshot({ path: 'C:/Users/hyounsookim/AppData/Local/Temp/janggi-dialog.png' });

out.review = await clickBtn('기보 살펴보기');
await page.waitForTimeout(200);
out.dialogGone = await page.evaluate(() => !document.querySelector('.modal__box'));

await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(400);
out.resumeBanner = await page.evaluate(() => document.querySelector('.notice')?.innerText.split('\n')[0] ?? null);
out.resumeClick = await clickBtn('이어하기');
await page.waitForTimeout(300);
out.resumed = await page.evaluate(() => ({
  moves: [...document.querySelectorAll('.movelist__text')].map((n) => n.textContent),
  status: document.querySelector('.status')?.textContent ?? null,
}));
return JSON.stringify(out);

Replacing 7 lines with 9 lines in 
Playwright 코드 실행함
Completed with input: await page.setViewportSize({ width: 420, height: 860 });
await page.waitForTimeout(400);
const mobile = await page.evaluate(() => {
  const r = document.querySelector('.board').getBoundingClientRect();
  return [Math.round(r.width), Math.round(r.height), window.innerWidth, window.innerHeight];
});
await page.screenshot({ path: 'C:/Users/hyounsookim/AppData/Local/Temp/janggi-mobile.png' });
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(400);
const desktop = await page.evaluate(() => {
  const r = document.querySelector('.board').getBoundingClientRect();
  return [Math.round(r.width), Math.round(r.height), window.innerWidth, window.innerHeight];
});
await page.screenshot({ path: 'C:/Users/hyounsookim/AppData/Local/Temp/janggi-desktop.png' });
return JSON.stringify({ mobile, desktop });

Viewed image 

Viewed image 

README를 작성하고 최종 검증합니다.   

Execution complete: 최종 빌드/테스트/검증

Ran terminal command: Set-Location 'C:\Work\Azure\janggi\opus5'; Write-Output '=== BUILD ==='; npm run build; $buildCode = $LASTEXITCODE; Write-Output "=== BUILD_EXIT_CODE: $buildCode ==="; if (Test-Path .\dist) { Write-Output '=== DIST_ASSETS ==='; Get-ChildItem .\dist -Recurse -File | ForEach-Object { $rel = $_.FullName.Substring((Resolve-Path .\dist).Path.Length + 1); '{0} {1} bytes' -f $rel, $_.Length } } else { Write-Output '=== DIST_ASSETS: directory missing ===' }; Write-Output '=== VITEST ==='; npx vitest run; $testCode = $LASTEXITCODE; Write-Output "=== VITEST_EXIT_CODE: $testCode ==="; Write-Output '=== VERIFY_ENGINE ==='; npx tsx scripts/verify-engine.ts --games 300 --depth 3; $verifyCode = $LASTEXITCODE; Write-Output "=== VERIFY_EXIT_CODE: $verifyCode ==="; Write-Output "=== SCREENS_EXISTS: $(Test-Path 'C:\Work\Azure\janggi\opus5\.screens') ==="

터미널 출력 확인됨

터미널이 종료되었습니다.

터미널 출력 확인됨

터미널 출력 확인됨

Searched for files matching `**/opus5/.screens/**`, 1 match

터미널이 종료되었습니다.

Ran terminal command: Remove-Item -Recurse -Force 'C:\Work\Azure\janggi\opus5\.screens'; Get-ChildItem 'C:\Work\Azure\janggi\opus5' -Force | Select-Object -ExpandProperty Name

`opus5`에 장기 게임을 완성했습니다. P0~P9, P12를 구현하고 P10(AI)·P11(온라인)은 제외했습니다.

## 구조

```
opus5/
  RULES.md              P1 명세 그대로 고정 (모든 판단의 근거)
  src/engine/           순수 TS. React·DOM 미참조
    types.ts board.ts moves/{cha,po,ma,sang,gung,jol}.ts
    rules.ts result.ts janggi-notation.ts perft.ts verification.ts
  src/state/            useReducer 상태 + 기보 저장/검증 파서
  src/ui/               SVG 렌더링·입력만 담당 (규칙 판단 없음)
  scripts/              콘솔 대국·회귀 검증
## 샹치 오구현 방지 지점

포는 이동·공격 모두 포대 1개 필수(포는 포를 넘거나 잡지 못함), 상은 1직진+2대각에 중간 2지점 각각 차단 판정, 졸/병은 처음부터 좌우 이동 가능·후진 불가, 차·궁·사의 궁성 대각선 이동, 강(河) 없음, 한 수 쉬기 허용. 공격 판정(`isAttacked`)은 이동 생성기를 그대로 재사용해 규칙이 갈라지지 않게 했습니다.

## 검증 결과

- 테스트 **70개 통과** (기물별 케이스 + 합법수/장군 + 외통·빅장·반복·점수)
- perft 회귀 고정: depth1 **31**(수기 계산과 일치), depth2 961, depth3 30506
- 랜덤 대국 **1000판**: 규칙 위반 0건 (궁 포획수 생성/보드 이탈/궁성 이탈/포 규칙/졸 후진/undo 불일치 전부 검사)
- 빌드 통과, 브라우저 실측: 클릭 착수·드래그앤드롭·한수쉼·무르기·리플레이·기권 다이얼로그·보드 뒤집기·한글 표기·색약 팔레트·localStorage 이어하기 모두 동작 확인

## 실행

```bash
cd opus5
npm install
npm run dev     # 개발 서버
npm test        # 엔진 테스트
npm run verify  # 랜덤 1000판 규칙 위반 검사
검증 중 두 가지를 실제로 고쳤습니다. SVG 보드가 `max-height`로 잘리던 문제는 viewBox 비율을 유지하는 `max-width` 계산으로 바꿨고, `setPointerCapture` 예외가 클릭 착수를 통째로 막던 문제는 착수 처리를 먼저 하고 캡처를 예외 처리하도록 순서를 바꿨습니다.

변경 사항 적용함.
~~~~

</details>