import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { runInNewContext } from 'node:vm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const SCOPE = 'https://janggi.example/game/';
const ORIGIN = new URL(SCOPE).origin;
const ASSET = new URL('assets/game.js', SCOPE).href;
const HTML = '<html><script type="module" src="./assets/game.js"></script></html>';
const SCRIPT = 'globalThis.gameStarted = true;';
type CacheInput = string | URL | { url: string; method?: string; headers?: Headers };
interface Options { ignoreVary?: boolean; ignoreSearch?: boolean; cacheName?: string }
interface Entry { request: Request; response: Response }
interface WorkerEvent {
  request?: { url: string; method: string; mode: string; headers: Headers };
  waitUntil: (promise: Promise<unknown>) => void;
  respondWith: (promise: Promise<Response | undefined>) => void;
}

/** Model Cache API's response Vary matching, which an ordinary URL-only Map misses. */
class MemoryCache {
  readonly entries: Entry[] = [];
  async addAll(urls: string[]) {
    for (const path of urls) {
      const url = new URL(path, SCOPE).href;
      const response = new Response(url.endsWith('.js') ? SCRIPT : HTML, { headers: { Vary: 'Origin' } });
      this.entries.push({ request: new Request(url), response });
    }
  }
  async match(input: CacheInput, options: Options = {}) {
    const request = typeof input === 'string' || input instanceof URL
      ? new Request(new URL(String(input), SCOPE)) : input;
    const requested = new URL(request.url);
    const match = this.entries.find(entry => {
      const stored = new URL(entry.request.url);
      if (options.ignoreSearch) { stored.search = ''; requested.search = ''; }
      if (stored.href !== requested.href) return false;
      if (options.ignoreVary) return true;
      return (entry.response.headers.get('Vary') ?? '').split(',').map(header => header.trim()).filter(Boolean)
        .every(header => header !== '*' && entry.request.headers.get(header) === (request.headers?.get(header) ?? null));
    });
    return match?.response.clone();
  }
}

function worker(source: string) {
  const cachesByName = new Map<string, MemoryCache>();
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const network = vi.fn(async () => { throw new TypeError('Network is offline'); });
  const cacheStorage = {
    async open(name: string) {
      if (!cachesByName.has(name)) cachesByName.set(name, new MemoryCache());
      return cachesByName.get(name)!;
    },
    async keys() { return [...cachesByName.keys()]; },
    async delete(name: string) { return cachesByName.delete(name); },
    async match(input: CacheInput, options: Options = {}) {
      for (const [name, cache] of cachesByName) {
        if (options.cacheName && options.cacheName !== name) continue;
        const response = await cache.match(input, options);
        if (response) return response;
      }
      return undefined;
    },
  };
  runInNewContext(source, {
    URL, Request, Response, Headers, caches: cacheStorage, fetch: network,
    self: {
      location: { origin: ORIGIN }, registration: { scope: SCOPE },
      skipWaiting: async () => {}, clients: { claim: async () => {} },
      addEventListener: (name: string, listener: (event: WorkerEvent) => void) => listeners.set(name, listener),
    },
  });
  async function lifecycle(name: string) {
    let work: Promise<unknown> = Promise.resolve();
    listeners.get(name)!({ waitUntil: promise => { work = promise; }, respondWith: () => {} });
    await work;
  }
  async function request(url: string, mode: string) {
    let response: Promise<Response | undefined> | undefined;
    listeners.get('fetch')!({
      request: { url, method: 'GET', mode, headers: new Headers({ Origin: ORIGIN }) },
      waitUntil: () => {}, respondWith: promise => { response = promise; },
    });
    return response;
  }
  return { caches: cacheStorage, network, lifecycle, request };
}

describe('배포된 서비스 워커의 오프라인 응답', () => {
  let fixture: string;
  let source: string;
  beforeAll(async () => {
    fixture = await mkdtemp(join(tmpdir(), 'janggi-sw-'));
    await mkdir(join(fixture, 'scripts'));
    await mkdir(join(fixture, 'dist', 'assets'), { recursive: true });
    await writeFile(join(fixture, 'scripts', 'build-sw.mjs'), await readFile(new URL('../../scripts/build-sw.mjs', import.meta.url)));
    await writeFile(join(fixture, 'dist', 'index.html'), HTML);
    await writeFile(join(fixture, 'dist', 'assets', 'game.js'), SCRIPT);
    await promisify(execFile)(process.execPath, [join(fixture, 'scripts', 'build-sw.mjs')]);
    source = await readFile(join(fixture, 'dist', 'sw.js'), 'utf8');
  });
  afterAll(async () => { if (fixture) await rm(fixture, { recursive: true, force: true }); });

  it('Origin 헤더가 달라져도 사전 저장한 모듈을 오프라인에서 실행할 수 있다', async () => {
    const sw = worker(source);
    await sw.lifecycle('install');
    await sw.lifecycle('activate');
    const response = await sw.request(ASSET, 'cors');
    expect(await response?.text()).toBe(SCRIPT);
    expect(sw.network).not.toHaveBeenCalled();
  });

  it('오프라인 경로 이동은 현재 설치의 시작 HTML로 복구한다', async () => {
    const sw = worker(source);
    await sw.lifecycle('install');
    const response = await sw.request(new URL('replay?move=3', SCOPE).href, 'navigate');
    expect(await response?.text()).toBe(HTML);
  });

  it('같은 주소가 다른 캐시에 있어도 현재 설치의 자산을 사용한다', async () => {
    const sw = worker(source);
    const unrelated = await sw.caches.open('another-app');
    unrelated.entries.push({ request: new Request(ASSET), response: new Response('stale script') });
    await sw.lifecycle('install');
    await sw.lifecycle('activate');
    const response = await sw.request(ASSET, 'cors');
    expect(await response?.text()).toBe(SCRIPT);
  });
});
