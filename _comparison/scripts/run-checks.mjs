// 구현체별 실제 빌드/테스트 실행 결과 수집
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT_DIR = join(__dirname, '..', 'data');
const FOLDERS = [
  'luna',
  'terra',
  'sol',
  'sol-fast',
  'astra',
  'codex-astra',
  'opus5',
  'sonnet5',
  'claude_opus5',
  'claude_sonnet5',
  'claude_code_design_opus5',
];
const selected = process.env.CHECK_PROJECTS?.split(',').filter(Boolean) ?? null;
if (selected?.some(folder => !FOLDERS.includes(folder))) throw new Error('Unknown CHECK_PROJECTS folder');
const previous = selected && existsSync(join(OUT_DIR, 'checks.json'))
  ? JSON.parse(readFileSync(join(OUT_DIR, 'checks.json'), 'utf8')).results
  : [];

function run(cwd, args, timeout) {
  const started = Date.now();
  const res = spawnSync(`npx ${args.join(' ')}`, { cwd, encoding: 'utf8', timeout, shell: true, windowsHide: true });
  const out = `${res.stdout ?? ''}\n${res.stderr ?? ''}`.replace(/\u001b\[[0-9;]*m/g, '');
  return {
    ok: res.status === 0,
    status: res.status,
    ms: Date.now() - started,
    tail: out.split(/\r?\n/).filter(Boolean).slice(-60).join('\n'),
  };
}

function runNpm(cwd, args, timeout) {
  const started = Date.now();
  const res = spawnSync('npm', args, { cwd, encoding: 'utf8', timeout, shell: process.platform === 'win32', windowsHide: true });
  const out = `${res.stdout ?? ''}\n${res.stderr ?? ''}`.replace(/\u001b\[[0-9;]*m/g, '');
  return { ok: res.status === 0, status: res.status, ms: Date.now() - started, tail: out.split(/\r?\n/).filter(Boolean).slice(-60).join('\n') };
}

const results = [];
for (const folder of FOLDERS.filter(folder => !selected || selected.includes(folder))) {
  const cwd = join(ROOT, folder);
  if (!existsSync(cwd)) continue;
  process.stdout.write(`\n### ${folder}\n`);

  if (folder === 'claude_code_design_opus5') {
    const test = runNpm(cwd, ['run', 'test'], 5 * 60 * 1000);
    const typecheck = runNpm(cwd, ['run', 'check'], 5 * 60 * 1000);
    const build = runNpm(cwd, ['run', 'build'], 5 * 60 * 1000);
    const jsAssets = ['dist/janggi-engine.js', 'dist/support.js', 'dist/_ds/industry-5edee50d-9d66-40a5-a7f4-9a1863a3a1ca/_ds_bundle.js']
      .map(file => join(cwd, file))
      .filter(existsSync)
      .map(file => statSync(file).size / 1024);
    const bundleKb = Math.round(jsAssets.reduce((sum, size) => sum + size, 0) * 100) / 100;
    const passed = Number(test.tail.match(/\bpass\s+(\d+)/)?.[1] ?? 0);
    const total = Number(test.tail.match(/\btests\s+(\d+)/)?.[1] ?? passed);
    const testStats = { failed: Number(test.tail.match(/\bfail\s+(\d+)/)?.[1] ?? 0), passed, total, files: 1 };
    console.log(`  test  : ${test.ok ? 'PASS' : 'FAIL'} (${(test.ms / 1000).toFixed(1)}s) ${JSON.stringify(testStats)}`);
    console.log(`  check : ${typecheck.ok ? 'PASS' : 'FAIL'} (${(typecheck.ms / 1000).toFixed(1)}s)`);
    console.log(`  build : ${build.ok ? 'PASS' : 'FAIL'} (${(build.ms / 1000).toFixed(1)}s) js=${bundleKb}kB`);
    results.push({ folder, test: { ...test, stats: testStats }, typecheck, build: { ...build, bundleKb } });
    continue;
  }

  const test = run(cwd, ['vitest', 'run'], 15 * 60 * 1000);
  const m = test.tail.match(/Tests\s+(?:(\d+)\s+failed[^\n]*?\|\s*)?(\d+)\s+passed(?:[^\n]*?\((\d+)\))?/);
  const files = test.tail.match(/Test Files\s+(?:(\d+)\s+failed[^\n]*?\|\s*)?(\d+)\s+passed/);
  const testStats = m
    ? { failed: Number(m[1] ?? 0), passed: Number(m[2]), total: Number(m[3] ?? m[2]), files: files ? Number(files[2]) : null }
    : null;
  console.log(`  test  : ${test.ok ? 'PASS' : 'FAIL'} (${(test.ms / 1000).toFixed(1)}s) ${testStats ? JSON.stringify(testStats) : ''}`);

  const typecheck = run(cwd, ['tsc', '-b', '--force'], 5 * 60 * 1000);
  console.log(`  tsc   : ${typecheck.ok ? 'PASS' : 'FAIL'} (${(typecheck.ms / 1000).toFixed(1)}s)`);

  const build = run(cwd, ['vite', 'build'], 10 * 60 * 1000);
  const jsAssets = [...build.tail.matchAll(/dist\/[\w./-]*\.js\s+([\d,.]+)\s*kB/g)].map((m) => Number(m[1].replace(/,/g, '')));
  const bundleKb = jsAssets.length ? Math.round(jsAssets.reduce((a, b) => a + b, 0) * 100) / 100 : null;
  console.log(`  build : ${build.ok ? 'PASS' : 'FAIL'} (${(build.ms / 1000).toFixed(1)}s) js=${bundleKb ?? '?'}kB`);

  results.push({ folder, test: { ...test, stats: testStats }, typecheck, build: { ...build, bundleKb } });
}

mkdirSync(OUT_DIR, { recursive: true });
const completeResults = selected
  ? FOLDERS.map(folder => results.find(result => result.folder === folder) ?? previous.find(result => result.folder === folder)).filter(Boolean)
  : results;
writeFileSync(join(OUT_DIR, 'checks.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results: completeResults }, null, 2), 'utf8');
console.log(`\n→ ${join(OUT_DIR, 'checks.json')}`);
