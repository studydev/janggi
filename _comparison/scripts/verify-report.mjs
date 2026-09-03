// report.html 렌더 검증 — 1920x1080 에서 주요 섹션을 잘라 저장
import { chromium } from 'playwright-core';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`file:///${join(BASE, 'report.html').replace(/\\/g, '/')}`, { waitUntil: 'load' });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => ({
  h2: [...document.querySelectorAll('h2')].map((h) => h.textContent.trim()),
  cards: document.querySelectorAll('.card').length,
  shots: document.querySelectorAll('.shot').length,
  rows: document.querySelectorAll('tbody tr').length,
  brokenImgs: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
  overflowX: document.documentElement.scrollWidth > window.innerWidth,
}));
console.log(JSON.stringify(info, null, 2));

const targets = ['02', '04', '05', '07'];
for (const n of targets) {
  const h = page.locator('h2', { hasText: new RegExp(`^${n}`) }).first();
  await h.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(BASE, `_verify-${n}.png`) });
}
await browser.close();
