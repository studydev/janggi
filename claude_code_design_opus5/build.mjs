import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
copyFileSync('Janggi.dc.html', 'dist/index.html');
copyFileSync('janggi-engine.js', 'dist/janggi-engine.js');
copyFileSync('support.js', 'dist/support.js');
const dsDir = 'dist/_ds/industry-5edee50d-9d66-40a5-a7f4-9a1863a3a1ca';
mkdirSync(dsDir, { recursive: true });
copyFileSync('_ds/industry-5edee50d-9d66-40a5-a7f4-9a1863a3a1ca/styles.css', `${dsDir}/styles.css`);
copyFileSync('_ds/industry-5edee50d-9d66-40a5-a7f4-9a1863a3a1ca/_ds_bundle.js', `${dsDir}/_ds_bundle.js`);

console.log('Built static Claude Code Design app → dist/');
