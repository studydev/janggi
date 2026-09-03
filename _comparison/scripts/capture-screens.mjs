// 각 구현체의 (1) 최초 진입 화면 (2) 대국 시작 직후 보드 화면을 1920x1080으로 캡처
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(__dirname, '..', 'screenshots');
const DATA = join(__dirname, '..', 'data');

const TARGETS = [
  { folder: 'luna', port: 5301 },
  { folder: 'terra', port: 5302 },
  { folder: 'sol', port: 5303 },
  { folder: 'opus5', port: 5304 },
  { folder: 'sonnet5', port: 5305 },
  { folder: 'claude_opus5', port: 5306 },
  { folder: 'claude_sonnet5', port: 5307 },
];

const START_RE = /(대국\s*시작|게임\s*시작|시작하기|대국\s*개시|새\s*대국|^\s*시작\s*$|플레이|start)/i;

mkdirSync(SHOTS, { recursive: true });
mkdirSync(DATA, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const log = [];

for (const t of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await ctx.newPage();
  const entry = { folder: t.folder, url: `http://127.0.0.1:${t.port}/`, title: null, startedVia: null, buttons: [], boardSvgs: null };

  try {
    await page.goto(entry.url, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    entry.title = await page.title();
    await page.screenshot({ path: join(SHOTS, `${t.folder}-1-intro.png`) });

    entry.buttons = await page.evaluate(() =>
      [...document.querySelectorAll('button, [role="button"], a')]
        .map((el) => (el.innerText || '').trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .slice(0, 40)
    );

    const clickables = page.locator('button, [role="button"]');
    const count = await clickables.count();
    for (let i = 0; i < count; i++) {
      const text = ((await clickables.nth(i).innerText()) || '').trim().replace(/\s+/g, ' ');
      if (!START_RE.test(text)) continue;
      await clickables.nth(i).click({ timeout: 8000, force: true });
      entry.startedVia = text;
      await page.waitForTimeout(1800);
      break;
    }

    entry.boardSvgs = await page.evaluate(() => document.querySelectorAll('svg').length);
    await page.screenshot({ path: join(SHOTS, `${t.folder}-2-game.png`) });
  } catch (e) {
    entry.error = String(e).split('\n')[0];
  }

  log.push(entry);
  console.log(
    `${t.folder.padEnd(15)} title="${entry.title}" start="${entry.startedVia ?? '(미클릭)'}" svg=${entry.boardSvgs} ${entry.error ?? ''}`
  );
  await ctx.close();
}

await browser.close();
writeFileSync(join(DATA, 'screenshots.json'), JSON.stringify({ generatedAt: new Date().toISOString(), shots: log }, null, 2), 'utf8');
console.log(`\n→ ${SHOTS}`);
