/**
 * localStorage 저장과 파일 내보내기/불러오기. 브라우저 API 는 여기에만 둔다.
 */
import { parseRecord, recordToJson, type GameRecord } from '../../engine/record';
import { DEFAULT_SETTINGS, type Settings } from '../settings';

const GAME_KEY = 'janggi:autosave:v1';
const SETTINGS_KEY = 'janggi:settings:v1';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 사파리 프라이빗 모드 등 — 저장 실패는 조용히 무시한다. */
  }
}

/* ------------------------------ 대국 ------------------------------ */

export function saveAutosave(record: GameRecord): void {
  safeSet(GAME_KEY, recordToJson(record));
}

export function loadAutosave(): GameRecord | null {
  const raw = safeGet(GAME_KEY);
  if (raw === null) return null;
  try {
    const record = parseRecord(JSON.parse(raw));
    return record.moves.length > 0 ? record : null;
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    window.localStorage.removeItem(GAME_KEY);
  } catch {
    /* noop */
  }
}

/* ------------------------------ 설정 ------------------------------ */

export function saveSettings(settings: Settings): void {
  safeSet(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): Settings {
  const raw = safeGet(SETTINGS_KEY);
  if (raw === null) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/* ------------------------- 파일 내보내기/읽기 ------------------------- */

export function downloadRecord(record: GameRecord, filename?: string): void {
  const blob = new Blob([recordToJson(record)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `janggi-${record.savedAt.slice(0, 19).replace(/[:T]/g, '')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readRecordFile(file: File): Promise<GameRecord> {
  const text = await file.text();
  return parseRecord(JSON.parse(text));
}
