// 각 구현의 "대국 시작 직후" 화면을 같은 조건으로 캡처해 비교용 썸네일을 만든다.
// 빌드된 dist-site 를 정적 서빙한 뒤 서브패스별로 순회한다.
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..', '..');
const SITE_DIR = process.env.SITE_DIR ? process.env.SITE_DIR : join(ROOT, 'dist-site');
const OUT_DIR = join(ROOT, '_comparison', 'screenshots', 'thumbs');
const DATA_PATH = join(ROOT, '_comparison', 'data', 'thumbnails.json');
const PORT = Number(process.env.THUMB_PORT ?? 4321);
const VIEWPORT = { width: 1200, height: 750 };
const START_PATTERN = /(대국\s*시작|게임\s*시작|새\s*대국|대국\s*개시|시작하기|바로\s*시작|플레이|start)/i;

const require = createRequire(join(ROOT, 'astra', 'package.json'));
const { chromium } = require('playwright');

const apps = JSON.parse(readFileSync(join(ROOT, 'deploy', 'apps.json'), 'utf8'));

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(SITE_DIR, clean);
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, 'index.html');
    return existsSync(index) ? index : null;
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  const appPath = clean.split('/').filter(Boolean)[0];
  const fallback = appPath ? join(SITE_DIR, appPath, 'index.html') : null;
  return fallback && existsSync(fallback) ? fallback : null;
}

function startServer() {
  const server = createServer((request, response) => {
    const file = resolveFile(request.url ?? '/');
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('not found');
      return;
    }
    response.writeHead(200, {
      'content-type': MIME_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(response);
  });
  return new Promise((resolveServer) => server.listen(PORT, '127.0.0.1', () => resolveServer(server)));
}

async function clickStart(page) {
  const clickable = page.locator('button, [role="button"], a');
  const count = await clickable.count();
  for (let index = 0; index < count; index++) {
    const target = clickable.nth(index);
    const text = ((await target.innerText().catch(() => '')) || '').trim().replace(/\s+/g, ' ');
    if (!text || !START_PATTERN.test(text)) continue;
    await target.click({ timeout: 8000, force: true }).catch(() => {});
    return text;
  }
  return null;
}

if (!existsSync(SITE_DIR)) throw new Error(`Missing built site: ${SITE_DIR}. node deploy/build-all.mjs 먼저 실행하세요.`);
mkdirSync(OUT_DIR, { recursive: true });

const server = await startServer();
const browser = await chromium.launch({ headless: true });
const captured = [];

for (const app of apps) {
  // 앱마다 새 컨텍스트를 써서 서비스 워커·저장소가 섞이지 않게 한다.
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR' });
  const page = await context.newPage();
  const entry = { dir: app.dir, path: app.path, title: null, startedVia: null, file: `${app.dir}.jpg` };

  try {
    await page.goto(`http://127.0.0.1:${PORT}/${app.path}/`, { waitUntil: 'networkidle', timeout: 30000 });
    entry.title = await page.title();
    entry.startedVia = await clickStart(page);
    await page.waitForTimeout(1600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT_DIR, entry.file), type: 'jpeg', quality: 82 });
    entry.bytes = statSync(join(OUT_DIR, entry.file)).size;
  } catch (error) {
    entry.error = String(error).split('\n')[0];
  }

  captured.push(entry);
  console.log(
    `${app.dir.padEnd(16)} start="${entry.startedVia ?? '(버튼 없음)'}" ${entry.bytes ? `${Math.round(entry.bytes / 1024)}kB` : (entry.error ?? '')}`,
  );
  await context.close();
}

await browser.close();
server.close();

writeFileSync(
  DATA_PATH,
  JSON.stringify({ generatedAt: new Date().toISOString(), viewport: VIEWPORT, thumbnails: captured }, null, 2) + '\n',
  'utf8',
);
console.log(`\n→ ${OUT_DIR}`);
