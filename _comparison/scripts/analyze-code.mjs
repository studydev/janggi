// 구현체별 정적 코드 지표 — 파일 수 / LOC / 레이어 비율 / 테스트 수 / 산출물 존재 여부
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT_DIR = join(__dirname, '..', 'data');

const FOLDERS = ['luna', 'terra', 'sol', 'opus5', 'sonnet5', 'claude_opus5', 'claude_sonnet5'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.vite', 'build']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function layerOf(rel) {
  const parts = rel.split(sep);
  if (/\.(test|spec)\.[tj]sx?$/.test(rel) || parts.includes('__tests__') || parts.includes('tests')) return 'test';
  if (parts[0] === 'scripts') return 'scripts';
  if (parts[0] !== 'src') return 'config';
  const sub = parts[1] ?? '';
  if (sub === 'engine') return 'engine';
  if (sub === 'ui' || sub === 'components' || sub === 'styles' || sub === 'assets') return 'ui';
  if (sub === 'state' || sub === 'game' || sub === 'store' || sub === 'context') return 'state';
  if (sub === 'ai') return 'ai';
  return 'app';
}

const results = [];
for (const folder of FOLDERS) {
  const dir = join(ROOT, folder);
  if (!existsSync(dir)) continue;

  const files = walk(dir).filter((f) => CODE_EXT.has(extname(f)));
  const layers = {};
  let totalLoc = 0;
  let totalFiles = 0;
  let testCases = 0;
  let testFiles = 0;

  for (const f of files) {
    const rel = relative(dir, f);
    const text = readFileSync(f, 'utf8');
    const loc = text.split(/\r?\n/).filter((l) => l.trim()).length;
    const layer = layerOf(rel);
    layers[layer] ??= { files: 0, loc: 0 };
    layers[layer].files++;
    layers[layer].loc += loc;
    totalFiles++;
    totalLoc += loc;
    if (layer === 'test') {
      testFiles++;
      testCases += (text.match(/^\s*(it|test)(\.\w+)?\s*\(/gm) ?? []).length;
    }
  }

  const has = (p) => existsSync(join(dir, p));
  results.push({
    folder,
    totalFiles,
    totalLoc,
    layers,
    testFiles,
    testCases,
    artifacts: {
      RULES: has('RULES.md'),
      CLAUDE: has('CLAUDE.md'),
      README: has('README.md'),
      manifest: has('public/manifest.webmanifest'),
      serviceWorker: has('public/sw.js') || has('public/service-worker.js'),
      viteConfig: has('vite.config.ts'),
    },
    srcTree: readdirSync(join(dir, 'src'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort(),
  });
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'code.json'), JSON.stringify({ generatedAt: new Date().toISOString(), projects: results }, null, 2), 'utf8');

for (const r of results) {
  const l = (k) => (r.layers[k] ? `${r.layers[k].loc}` : '0');
  console.log(
    `${r.folder.padEnd(15)} files=${String(r.totalFiles).padStart(3)} loc=${String(r.totalLoc).padStart(6)} ` +
      `engine=${l('engine').padStart(5)} ui=${l('ui').padStart(5)} state=${l('state').padStart(5)} ` +
      `test=${l('test').padStart(5)}(${r.testCases} cases) src=[${r.srcTree.join(',')}]`
  );
}
