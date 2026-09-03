import { replayMoves } from '../engine/rules';
import { DEFAULT_CONFIG, SETUP_CODES } from '../engine/types';
import type { GameConfig, GameState, Move, PieceType, Position, SetupCode, Side } from '../engine/types';

const STORAGE_KEY = 'janggi:autosave';
const RECORD_VERSION = 1;

export interface GameRecord {
  readonly version: number;
  readonly savedAt: string;
  readonly setup: Record<Side, SetupCode>;
  readonly config: GameConfig;
  readonly moves: Move[];
}

const PIECE_TYPES: readonly PieceType[] = ['GUNG', 'SA', 'CHA', 'PO', 'MA', 'SANG', 'JOL'];

export function toRecord(state: GameState): GameRecord {
  return {
    version: RECORD_VERSION,
    savedAt: new Date().toISOString(),
    setup: { HAN: state.setup.HAN, CHO: state.setup.CHO },
    config: state.config,
    moves: state.moveHistory.map((move) => ({ ...move })),
  };
}

export function fromRecord(record: GameRecord): GameState {
  return replayMoves(record.setup, record.config, record.moves);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePosition(value: unknown): Position {
  if (!isRecord(value)) throw new Error('좌표 형식이 아니다');
  const file = Number(value.file);
  const rank = Number(value.rank);
  if (!Number.isInteger(file) || file < 1 || file > 9) throw new Error('file 범위를 벗어났다');
  if (!Number.isInteger(rank) || rank < 1 || rank > 10) throw new Error('rank 범위를 벗어났다');
  return { file, rank };
}

function parseMove(value: unknown): Move {
  if (!isRecord(value)) throw new Error('수 형식이 아니다');
  const side = value.side === 'HAN' || value.side === 'CHO' ? value.side : null;
  if (!side) throw new Error('진영 값이 잘못됐다');
  const piece = PIECE_TYPES.find((type) => type === value.piece);
  if (!piece) throw new Error('기물 종류가 잘못됐다');
  const captured = value.captured == null ? null : PIECE_TYPES.find((type) => type === value.captured);
  if (captured === undefined) throw new Error('잡힌 기물 종류가 잘못됐다');
  return {
    from: parsePosition(value.from),
    to: parsePosition(value.to),
    piece,
    side,
    captured,
    isPass: value.isPass === true,
  };
}

function parseConfig(value: unknown): GameConfig {
  if (!isRecord(value)) return DEFAULT_CONFIG;
  const repetitionLimit = Number(value.repetitionLimit);
  const hanBonus = Number(value.hanBonus);
  return {
    bikjangDraw: value.bikjangDraw !== false,
    repetitionLimit: Number.isInteger(repetitionLimit) && repetitionLimit >= 2 && repetitionLimit <= 10
      ? repetitionLimit
      : DEFAULT_CONFIG.repetitionLimit,
    hanBonus: Number.isFinite(hanBonus) && hanBonus >= 0 && hanBonus <= 10 ? hanBonus : DEFAULT_CONFIG.hanBonus,
  };
}

function parseSetupCode(value: unknown): SetupCode {
  const found = SETUP_CODES.find((code) => code === value);
  if (!found) throw new Error('마상 배치 코드가 잘못됐다');
  return found;
}

/** 외부에서 들어온 JSON을 신뢰하지 않고 형식을 모두 검사한다. */
export function parseRecord(text: string): GameRecord {
  const raw: unknown = JSON.parse(text);
  if (!isRecord(raw)) throw new Error('기보 형식이 아니다');
  if (Number(raw.version) !== RECORD_VERSION) throw new Error('지원하지 않는 기보 버전이다');
  if (!isRecord(raw.setup)) throw new Error('배치 정보가 없다');
  if (!Array.isArray(raw.moves)) throw new Error('수 목록이 없다');

  return {
    version: RECORD_VERSION,
    savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : new Date().toISOString(),
    setup: { HAN: parseSetupCode(raw.setup.HAN), CHO: parseSetupCode(raw.setup.CHO) },
    config: parseConfig(raw.config),
    moves: raw.moves.map(parseMove),
  };
}

export function saveAutosave(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toRecord(state)));
  } catch {
    // 저장 공간이 없거나 접근이 막힌 환경은 그냥 건너뛴다
  }
}

export function loadAutosave(): GameRecord | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    return parseRecord(text);
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}

export function downloadRecord(record: GameRecord, filename = 'janggi-game.json'): void {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
