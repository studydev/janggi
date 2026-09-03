#!/usr/bin/env node
// 7개 장기 구현을 각각 서브패스 base 로 빌드해 하나의 정적 사이트로 합친다.
// 출력 경로는 OUT_DIR 로 바꿀 수 있다 (Docker 빌드에서는 /site).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = process.env.OUT_DIR ? resolve(process.env.OUT_DIR) : join(root, 'dist-site');
const apps = JSON.parse(readFileSync(join(here, 'apps.json'), 'utf8'));

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const app of apps) {
  const cwd = join(root, app.dir);
  console.log(`\n=== build ${app.dir} -> /${app.path}/ ===`);
  execFileSync(npm, ['run', 'build', '--', `--base=/${app.path}/`], {
    cwd,
    stdio: 'inherit',
    shell: isWindows, // Windows 에서 npm.cmd 실행에 필요
  });
  cpSync(join(cwd, 'dist'), join(outDir, app.path), { recursive: true });
}

const cards = apps
  .map(
    (app) => `        <a class="card" href="/${app.path}/">
          <div class="card-top">
            <h2>${escapeHtml(app.title)}</h2>
            <span class="path">/${escapeHtml(app.path)}/</span>
          </div>
          <p>${escapeHtml(app.desc)}</p>
          <footer>
            <span class="dir">${escapeHtml(app.dir)}/</span>
            <span class="go">대국 시작 &rarr;</span>
          </footer>
        </a>`,
  )
  .join('\n');

const html = readFileSync(join(here, 'landing.template.html'), 'utf8')
  .replace('        <!--CARDS-->', cards)
  .replace('<!--BUILT_AT-->', new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC');

writeFileSync(join(outDir, 'index.html'), html, 'utf8');
console.log(`\n완료: ${apps.length}개 앱 → ${outDir}`);
