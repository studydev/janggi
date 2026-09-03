// 세션별 LLM 사용량 측정
//   A) transcripts 재계산 — 라운드/툴호출/출력토큰을 o200k_base로 직접 토크나이즈
//   B) chatSessions 복원 — VS Code가 남긴 promptTokens/completionTokens/copilotCredits 원본
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode } from 'gpt-tokenizer/encoding/o200k_base';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data');

const STORAGE = 'C:\\Users\\hyounsookim\\AppData\\Roaming\\Code\\User\\workspaceStorage\\24287f757df022f0736b6fd1e95c49ac';
const TRANSCRIPTS = join(STORAGE, 'GitHub.copilot-chat', 'transcripts');
const CHAT_SESSIONS = join(STORAGE, 'chatSessions');

// System Instructions(26%) + Tool Definitions(54%) = 첫 요청 promptTokens 71,449의 80%
// → 매 라운드마다 재전송되는 고정 오버헤드. 5개 세션 모두 동일 워크스페이스/툴셋이라 공통 상수로 사용.
const BASE_OVERHEAD = 57159;

// 요청 단위 promptTokens 중 이 값 미만은 제목 생성 등 보조 요청으로 간주
const MAIN_REQUEST_MIN_PROMPT = 20000;

const TARGETS = [
  { folder: 'luna', model: 'gpt-5.6-luna', vendor: 'GitHub Copilot', sessionId: '363803fb-94d6-4714-8278-10bfd7fe3821' },
  { folder: 'terra', model: 'gpt-5.6-terra', vendor: 'GitHub Copilot', sessionId: 'c0f26878-5abd-48f2-8d11-c5c3f63b3471' },
  { folder: 'sol', model: 'gpt-5.6-sol', vendor: 'GitHub Copilot', sessionId: 'e7788ea7-ee25-48d9-b62f-847caf059dd9' },
  { folder: 'opus5', model: 'claude-opus-5', vendor: 'GitHub Copilot', sessionId: '26112163-024b-4c24-95ba-0f5884657058' },
  { folder: 'sonnet5', model: 'claude-sonnet-5', vendor: 'GitHub Copilot', sessionId: 'fb8d723c-492f-4028-a052-be645322e9d3' },
  { folder: 'claude_opus5', model: 'Claude Opus (Claude Code)', vendor: 'Anthropic', sessionId: null },
  { folder: 'claude_sonnet5', model: 'Claude Sonnet (Claude Code)', vendor: 'Anthropic', sessionId: null },
];

const tok = (s) => (s ? encode(String(s)).length : 0);

function readJsonl(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** transcripts/<sid>.jsonl 를 순회하며 정확히 셀 수 있는 값만 집계 */
function analyzeTranscript(sessionId) {
  const path = join(TRANSCRIPTS, `${sessionId}.jsonl`);
  if (!existsSync(path)) return null;

  const events = readJsonl(path);
  const r = {
    rounds: 0,
    userMessages: 0,
    userTokens: 0,
    assistantMessages: 0,
    assistantTextTokens: 0,
    reasoningTokens: 0,
    toolArgTokens: 0,
    toolCalls: 0,
    toolFailures: 0,
    toolBreakdown: {},
    firstTs: null,
    lastTs: null,
    userPrompts: [],
  };

  for (const e of events) {
    const ts = e.timestamp ? Date.parse(e.timestamp) : null;
    if (ts) {
      if (r.firstTs === null || ts < r.firstTs) r.firstTs = ts;
      if (r.lastTs === null || ts > r.lastTs) r.lastTs = ts;
    }
    const d = e.data ?? {};

    switch (e.type) {
      case 'assistant.turn_start':
        r.rounds++;
        break;
      case 'user.message':
        r.userMessages++;
        r.userTokens += tok(d.content);
        r.userPrompts.push({ ts: e.timestamp, text: String(d.content ?? '') });
        break;
      case 'assistant.message':
        r.assistantMessages++;
        r.assistantTextTokens += tok(d.content);
        r.reasoningTokens += tok(d.reasoningText);
        for (const t of d.toolRequests ?? []) r.toolArgTokens += tok(t.arguments) + tok(t.name);
        break;
      case 'tool.execution_start':
        r.toolCalls++;
        r.toolBreakdown[d.toolName] = (r.toolBreakdown[d.toolName] ?? 0) + 1;
        break;
      case 'tool.execution_complete':
        if (d.success === false) r.toolFailures++;
        break;
    }
  }

  r.outputTokens = r.assistantTextTokens + r.reasoningTokens + r.toolArgTokens;
  r.durationMs = r.firstTs !== null && r.lastTs !== null ? r.lastTs - r.firstTs : null;
  return r;
}

/** chatSessions/<sid>.jsonl 은 kind0=스냅샷 / kind1=경로 대입 / kind2=배열 추가 형태의 증분 로그 */
function replayChatSession(sessionId) {
  const path = join(CHAT_SESSIONS, `${sessionId}.jsonl`);
  if (!existsSync(path)) return null;

  let state = {};
  for (const rec of readJsonl(path)) {
    if (rec.kind === 0) {
      state = rec.v ?? {};
      continue;
    }
    const parts = String(rec.k ?? '').split('/').filter(Boolean);
    if (!parts.length) continue;

    let node = state;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (node[key] === undefined || node[key] === null) node[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      node = node[key];
    }
    const last = parts[parts.length - 1];

    if (rec.kind === 1) {
      node[last] = rec.v;
    } else if (rec.kind === 2) {
      if (!Array.isArray(node[last])) node[last] = [];
      const arr = node[last];
      const items = Array.isArray(rec.v) ? rec.v : [rec.v];
      if (rec.i === undefined || rec.i === null) arr.push(...items);
      else items.forEach((item, j) => (arr[rec.i + j] = item));
    }
  }
  return state;
}

function analyzeChatSession(sessionId) {
  const state = replayChatSession(sessionId);
  if (!state) return null;

  const requests = Array.isArray(state.requests) ? state.requests : [];
  const rows = requests.map((q, idx) => ({
    index: idx + 1,
    timestamp: q?.timestamp ?? null,
    modelId: q?.modelId ?? null,
    prompt: typeof q?.message?.text === 'string' ? q.message.text.slice(0, 400) : null,
    promptTokens: typeof q?.promptTokens === 'number' ? q.promptTokens : null,
    completionTokens: typeof q?.completionTokens === 'number' ? q.completionTokens : null,
    copilotCredits: typeof q?.copilotCredits === 'number' ? q.copilotCredits : null,
    promptTokenDetails: q?.promptTokenDetails ?? null,
    responseParts: Array.isArray(q?.response) ? q.response.length : null,
  }));

  // 복원 실패 대비: 원문에서 직접 긁어 보강
  const raw = readFileSync(join(CHAT_SESSIONS, `${sessionId}.jsonl`), 'utf8');
  const grab = (re) => [...raw.matchAll(re)].map((m) => Number(m[1]));
  const rawPrompt = grab(/"promptTokens":(\d+)/g);
  const rawCompletion = grab(/"completionTokens":(\d+)/g);
  const rawCredits = grab(/"copilotCredits":([0-9.]+)/g);

  const modelIds = [...new Set([...raw.matchAll(/"modelId"\s*:\s*"([^"]+)"/g)].map((m) => m[1]))];
  const customTitle = raw.match(/"customTitle","v":"([^"]*)"/)?.[1] ?? state.customTitle ?? null;

  return { requests: rows, rawPrompt, rawCompletion, rawCredits, modelIds, customTitle };
}

const results = [];
for (const t of TARGETS) {
  const entry = { ...t, measured: null, recorded: null, estimate: null };

  if (t.sessionId) {
    entry.measured = analyzeTranscript(t.sessionId);
    entry.recorded = analyzeChatSession(t.sessionId);

    const samples = (entry.recorded?.rawPrompt ?? []).filter((v) => v >= MAIN_REQUEST_MIN_PROMPT);
    const rounds = entry.measured?.rounds ?? 0;
    if (rounds && samples.length) {
      const maxCtx = Math.max(...samples);
      const meanCtx = samples.reduce((a, b) => a + b, 0) / samples.length;
      entry.estimate = {
        baseOverhead: BASE_OVERHEAD,
        rounds,
        observedMin: Math.min(...samples),
        observedMax: maxCtx,
        observedMean: Math.round(meanCtx),
        // 컨텍스트가 BASE에서 관측 최대치까지 선형 증가한다고 보고 라운드마다 합산
        inputLower: rounds * BASE_OVERHEAD,
        inputLinear: Math.round((rounds * (BASE_OVERHEAD + maxCtx)) / 2),
        inputUpper: rounds * maxCtx,
        outputMeasured: entry.measured.outputTokens,
      };
      entry.estimate.totalLinear = entry.estimate.inputLinear + entry.estimate.outputMeasured;
    }
  }
  results.push(entry);
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, 'tokens.json');
writeFileSync(
  outPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), baseOverhead: BASE_OVERHEAD, sessions: results }, null, 2),
  'utf8'
);

for (const e of results) {
  if (!e.measured) {
    console.log(`${e.folder.padEnd(15)} (세션 로그 없음 — 측정 대기)`);
    continue;
  }
  const m = e.measured;
  const est = e.estimate;
  console.log(
    `${e.folder.padEnd(15)} model=${e.model.padEnd(16)} rounds=${String(m.rounds).padStart(4)} ` +
      `tools=${String(m.toolCalls).padStart(4)} out=${String(m.outputTokens).padStart(7)} ` +
      `ctx[min/max]=${est ? `${est.observedMin}/${est.observedMax}` : '-'} ` +
      `estIn=${est ? est.inputLinear.toLocaleString() : '-'} ` +
      `dur=${m.durationMs ? (m.durationMs / 3600000).toFixed(2) + 'h' : '-'}`
  );
}
console.log(`\n→ ${outPath}`);
