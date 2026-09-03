/**
 * PWA 아이콘 PNG 생성기 (의존성 없음).
 * 나무색 라운드 사각형 위에 기물 원을 그린 단순한 아이콘을 픽셀로 직접 만든다.
 *
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BOARD = [229, 193, 133];
const LINE = [107, 74, 36];
const FACE = [246, 236, 216];
const HAN = [217, 45, 32];

function crc32(buf) {
  let c;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function icon(size) {
  const c = size / 2;
  const pieceR = size * 0.3;
  const ringR = size * 0.235;
  return (x, y) => {
    const dx = x - c;
    const dy = y - c;
    const d = Math.hypot(dx, dy);
    if (d < ringR) return HAN;
    if (d < pieceR) return FACE;
    // 격자선 두 줄을 배경에 넣어 장기판임을 알린다
    const g = size * 0.22;
    if (Math.abs(((x + g / 2) % g) - g / 2) < size * 0.012) return LINE;
    if (Math.abs(((y + g / 2) % g) - g / 2) < size * 0.012) return LINE;
    return BOARD;
  };
}

for (const size of [192, 512]) {
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), png(size, icon(size)));
  console.log(`public/icon-${size}.png`);
}
