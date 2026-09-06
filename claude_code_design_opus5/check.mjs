import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

for (const file of ['Janggi.dc.html', 'janggi-engine.js', 'support.js', '_ds/industry-5edee50d-9d66-40a5-a7f4-9a1863a3a1ca/_ds_bundle.js']) {
  if (!existsSync(file)) throw new Error(`Missing runtime asset: ${file}`);
}

const html = readFileSync('Janggi.dc.html', 'utf8');
const component = html.match(/<script type="text\/x-dc"[^>]*>\n([\s\S]*?)\n<\/script>/)?.[1];
if (!component) throw new Error('Missing Claude Code Design component script');

for (const [name, source] of [['janggi-engine.js', readFileSync('janggi-engine.js', 'utf8')], ['component script', component]]) {
  const result = spawnSync(process.execPath, ['--check', '-'], { input: source, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${name} syntax check failed:\n${result.stderr}`);
}

console.log('Static assets and JavaScript syntax: passed');
