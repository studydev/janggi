import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { developmentRecords, formatUsd } from './development-records.mjs';

const require = createRequire(new URL('../astra/package.json', import.meta.url));
const { chromium } = require('playwright');
const apps = JSON.parse(readFileSync(new URL('./apps.json', import.meta.url), 'utf8'));
const data = JSON.parse(readFileSync(new URL('./development-records.json', import.meta.url), 'utf8'));
const records = developmentRecords(apps, data);
const baseUrl = process.env.PORTAL_URL ?? 'http://127.0.0.1:4190';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseUrl);
  for (const section of ['#comparison', '#costs']) {
    assert.match(await page.locator(section).innerText(), /구독제는 정확한 토큰당 비용을 측정하기 어렵기 때문에.*비용 구조가 일치하지 않을 수 있습니다/);
  }
  const rows = page.locator('.comparison-table tbody tr');
  const cards = page.locator('.impl');
  assert.equal(await rows.count(), apps.length);
  assert.equal(await cards.count(), apps.length);
  for (const app of apps) {
    const row = rows.filter({ has: page.locator(`[href="#result-${app.dir}"]`) });
    const card = page.locator(`#result-${app.dir}`);
    assert.equal(await row.count(), 1, app.dir);
    assert.equal(await row.getAttribute('data-env'), app.env);
    const record = records.get(app.dir);
    assert.equal(await row.locator('.cost-value').innerText(), `${record.usd == null ? '약 ' : ''}${formatUsd(record.usd ?? record.estimate.usd)}`);
    assert.match(await row.locator('.cost-kind').innerText(), record.usd == null ? /배분 추정/ : /크레딧 환산/);
    assert((await card.locator('.description').innerText()).length > 10);
    const link = card.locator('.app-link');
    const href = await link.getAttribute('href');
    assert.equal(new URL(href, baseUrl).pathname, `/${app.path}/`);
    const response = await context.request.get(new URL(href, baseUrl).href);
    assert.equal(response.status(), 200, app.dir + ' app HTTP');
    const documentText = await response.text();
    assert(documentText.includes(app.dir === 'claude_code_design_opus5' ? '<x-dc>' : '<div id="root">'), app.dir + ' app document');
    const logResponse = await context.request.get(`${baseUrl}/comparison/logs/${app.dir}.txt`);
    assert.equal(logResponse.status(), 200, app.dir + ' log');
    assert((await logResponse.text()).includes('| Model |'));
    await card.scrollIntoViewIfNeeded();
    await card.locator('img').evaluate(image => image.decode());
    assert(await card.locator('img').evaluate(image => image.naturalWidth > 0));
  }
  for (const [platform, count] of [['copilot', 7], ['claude-code', 2], ['claude-code-design', 1], ['codex', 1]]) {
    await page.locator('#platform-filter').selectOption(platform);
    assert.equal(await page.locator('.comparison-table tbody tr:visible').count(), count);
    assert.equal(await page.locator('.impl:visible').count(), count);
  }
  await page.locator('#platform-filter').selectOption('all');
  await page.locator('#sort-order').selectOption('cost');
  assert.deepEqual(await rows.evaluateAll(items => items.slice(0, 4).map(item => item.dataset.project)), ['claude_sonnet5', 'claude_opus5', 'claude_code_design_opus5', 'codex-astra']);
  await page.locator('#sort-order').selectOption('time');
  assert.equal(await rows.first().getAttribute('data-project'), 'sol-fast');
  assert.equal(await rows.evaluateAll(items => items.filter(item => !item.dataset.time).length), 3);
  await page.locator('#model-search').fill('sonnet');
  assert.equal(await page.locator('.comparison-table tbody tr:visible').count(), 2);
  await page.locator('#model-search').fill('no-matching-model');
  assert(await page.locator('#empty-state').isVisible());
  assert.equal(await page.locator('.impl:visible').count(), 0);
  await page.locator('#model-search').fill('');
  await page.locator('#sort-order').selectOption('default');
  assert.equal(await page.locator('.cost-chart').count(), 2);
  assert.equal(await page.locator('.cost-chart').first().locator('.cost-row').count(), apps.length);
  assert.equal(await page.locator('.cost-chart').last().locator('.cost-row').count(), 4);
  assert.equal(await page.locator('.cost-chart').first().locator('.estimated').count(), 4);
  for (const app of apps) {
    const chartRow = page.locator('.cost-chart').first().locator(`[data-project="${app.dir}"]`);
    const record = records.get(app.dir);
    assert.equal(Number(await chartRow.getAttribute('data-value')), record.usd ?? record.estimate.usd);
  }
  assert.match(await page.locator('.allocation-formula').innerText(), /월 \$20.*30일.*2개.*\$0.333.*60개/);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow at ${width}`);
    const tableBox = await page.locator('.table-region').boundingBox();
    assert(tableBox.y < (width === 1440 ? 1000 : 844), `comparison not in first viewport: ${width}`);
    await page.screenshot({ path: join(tmpdir(), `janggi-portal-${width}.png`) });
    await page.locator('.impl').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(tmpdir(), `janggi-gallery-${width}.png`) });
    await page.locator('#costs').scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `cost chart overflow at ${width}`);
    for (const bar of await page.locator('.cost-bar').all()) {
      const bounds = await bar.boundingBox();
      assert(bounds.width > 0 && bounds.height > 0, 'nonblank cost bar');
    }
    await page.locator('#costs').screenshot({ path: join(tmpdir(), `janggi-costs-${width}.png`), style: '.topbar { visibility: hidden !important; }' });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.impl .app-link').first().click();
  await page.waitForURL('**/astra/');
  await page.locator('#root > *').first().waitFor();
  await page.goBack();
  await page.locator('#comparison').waitFor();
  assert.equal(await rows.count(), apps.length);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${apps.length} apps, 4 platforms, costs, filters, sorting, search, screenshots, app/log links, app navigation and 1440/390/320px layouts. Screenshots: ${tmpdir()}/janggi-{portal,gallery}-{1440,390,320}.png`);
} finally {
  await browser.close();
}
