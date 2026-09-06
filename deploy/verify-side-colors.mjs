import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(new URL('../astra/package.json', import.meta.url));
const { chromium } = require('playwright');
const baseUrl = process.env.PORTAL_URL ?? 'http://127.0.0.1:4190';
const browser = await chromium.launch();

async function assertSideColor(locator, property, side) {
  assert(await locator.count() > 0, `Missing ${side} element`);
  for (const element of await locator.all()) {
    const color = await element.evaluate((node, key) => getComputedStyle(node)[key], property);
    const channels = color.match(/[\d.]+/g)?.map(Number);
    assert(channels?.length >= 3, color);
    const [red, green, blue] = channels;
    assert(side === 'cho' ? green > red && green > blue : red > green && red > blue, `${side} ${property}: ${color}`);
  }
}

try {
  for (const app of ['luna', 'terra']) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: 1200, height: 750 }, colorScheme: theme, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/${app}/?scoutTheme=${theme}`);
      for (const side of ['cho', 'han']) {
        await assertSideColor(page.locator(app === 'luna' ? `.${side}-pip` : `.formation-${side} .formation-glyphs`), app === 'luna' ? 'borderTopColor' : 'color', side);
      }
      await page.getByRole('button', { name: /대국 시작/ }).click();
      await page.locator('.piece-cho').first().waitFor();
      for (const width of [1200, 390]) {
        await page.setViewportSize({ width, height: width === 1200 ? 750 : 844 });
        for (const side of ['cho', 'han']) {
          await assertSideColor(page.locator(`.piece-${side} ${app === 'luna' ? '.piece-glyph' : '.piece-symbol'}`), 'fill', side);
          await assertSideColor(page.locator(`.piece-${side} ${app === 'luna' ? '.piece-edge' : '.piece-disc'}`), 'stroke', side);
          if (app === 'luna') await assertSideColor(page.locator(`.player-${side} .side-pip`), 'borderTopColor', side);
        }
        await page.screenshot({ path: join(tmpdir(), `janggi-${app}-${theme}-${width}.png`), fullPage: true });
      }
      await page.getByRole('button', { name: /한 수 쉬기/ }).click();
      await assertSideColor(page.locator(app === 'luna' ? '.player-han.is-turn' : '.turn-han'), app === 'luna' ? 'borderTopColor' : 'backgroundColor', 'han');
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  console.log('PASS: Luna/Terra setup, pieces, outlines and turn colors; light/dark; desktop/mobile; no runtime errors.');
} finally {
  await browser.close();
}