/**
 * 기보 직렬화와 리플레이. 순수 함수만 쓴다(localStorage 등은 UI 레이어 담당).
 * 근거: P9 「수를 { from, to, piece, captured, isPass } 구조로 저장한다」
 */
import { createInitialState } from './board';
import { makeMove, pass } from './rules';
import {
  DEFAULT_CONFIG,
  HORSE_SETUPS,
  type GameConfig,
  type GameState,
  type HorseSetup,
  type Move,
  type Side,
} from './types';

export const RECORD_VERSION = 1;

export interface GameRecord {
  readonly version: number;
  readonly setup: Readonly<Record<Side, HorseSetup>>;
  readonly config: GameConfig;
  readonly moves: readonly Move[];
  readonly savedAt: string;
}

export function toRecord(state: GameState): GameRecord {
  return {
    version: RECORD_VERSION,
    setup: state.setup,
    config: state.config,
    moves: state.moveHistory,
    savedAt: new Date().toISOString(),
  };
}

/** 초기 국면부터 ply 수만큼 다시 두어 그 시점의 상태를 만든다. */
export function replayMoves(
  setup: Readonly<Record<Side, HorseSetup>>,
  config: GameConfig,
  moves: readonly Move[],
  ply: number = moves.length,
): GameState {
  let state = createInitialState(setup.HAN, setup.CHO, config);
  const limit = Math.max(0, Math.min(ply, moves.length));
  for (let i = 0; i < limit; i++) {
    const move = moves[i]!;
    state = move.isPass ? pass(state) : makeMove(state, move);
  }
  return state;
}

/** 진행 중인 대국의 특정 시점 상태. 리플레이 화면이 쓴다. */
export function stateAtPly(state: GameState, ply: number): GameState {
  return replayMoves(state.setup, state.config, state.moveHistory, ply);
}

/* ------------------------------------------------------------------ */
/* 불러오기 (외부 입력이므로 전부 검증한다)                              */
/* ------------------------------------------------------------------ */

export class RecordParseError extends Error {}

function isHorseSetup(v: unknown): v is HorseSetup {
  return typeof v === 'string' && (HORSE_SETUPS as readonly string[]).includes(v);
}

function parsePosition(v: unknown, where: string): { file: number; rank: number } {
  if (typeof v !== 'object' || v === null) throw new RecordParseError(`${where}: 좌표가 없습니다`);
  const o = v as Record<string, unknown>;
  if (typeof o.file !== 'number' || typeof o.rank !== 'number') {
    throw new RecordParseError(`${where}: 좌표 형식이 잘못되었습니다`);
  }
  return { file: o.file, rank: o.rank };
}

/** JSON.parse 결과를 GameRecord 로 검증한다. 형식이 틀리면 던진다. */
export function parseRecord(input: unknown): GameRecord {
  if (typeof input !== 'object' || input === null) {
    throw new RecordParseError('기보 형식이 아닙니다');
  }
  const o = input as Record<string, unknown>;

  const setupRaw = o.setup as Record<string, unknown> | undefined;
  if (!setupRaw || !isHorseSetup(setupRaw.HAN) || !isHorseSetup(setupRaw.CHO)) {
    throw new RecordParseError('마·상 배치 정보가 잘못되었습니다');
  }
  const setup = { HAN: setupRaw.HAN, CHO: setupRaw.CHO } as const;

  const configRaw = (o.config ?? {}) as Record<string, unknown>;
  const config: GameConfig = {
    bikjangEnabled:
      typeof configRaw.bikjangEnabled === 'boolean'
        ? configRaw.bikjangEnabled
        : DEFAULT_CONFIG.bikjangEnabled,
    repetitionLimit:
      typeof configRaw.repetitionLimit === 'number'
        ? configRaw.repetitionLimit
        : DEFAULT_CONFIG.repetitionLimit,
    hanBonus: typeof configRaw.hanBonus === 'number' ? configRaw.hanBonus : DEFAULT_CONFIG.hanBonus,
    maxPlies: typeof configRaw.maxPlies === 'number' ? configRaw.maxPlies : DEFAULT_CONFIG.maxPlies,
  };

  if (!Array.isArray(o.moves)) throw new RecordParseError('수 목록이 없습니다');

  const moves: Move[] = o.moves.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new RecordParseError(`${i + 1}번째 수의 형식이 잘못되었습니다`);
    }
    const m = raw as Record<string, unknown>;
    const isPass = m.isPass === true;
    const side = m.side === 'HAN' || m.side === 'CHO' ? m.side : null;
    if (side === null) throw new RecordParseError(`${i + 1}번째 수에 진영이 없습니다`);
    return {
      from: isPass ? { file: 0, rank: 0 } : parsePosition(m.from, `${i + 1}번째 수`),
      to: isPass ? { file: 0, rank: 0 } : parsePosition(m.to, `${i + 1}번째 수`),
      piece: (m.piece ?? null) as Move['piece'],
      side,
      captured: (m.captured ?? null) as Move['captured'],
      isPass,
    };
  });

  return {
    version: typeof o.version === 'number' ? o.version : RECORD_VERSION,
    setup,
    config,
    moves,
    savedAt: typeof o.savedAt === 'string' ? o.savedAt : new Date().toISOString(),
  };
}

/**
 * 기보를 실제로 다시 두어 상태를 복원한다.
 * 저장된 수가 규칙에 맞지 않으면(파일 손상, 규칙 변경 등) 그 지점에서 멈추고 알린다.
 */
export function stateFromRecord(record: GameRecord): { state: GameState; appliedPlies: number } {
  let state = createInitialState(record.setup.HAN, record.setup.CHO, record.config);
  let applied = 0;

  for (const move of record.moves) {
    try {
      state = move.isPass ? pass(state) : makeMove(state, move);
      applied++;
    } catch {
      break;
    }
  }
  return { state, appliedPlies: applied };
}

export function recordToJson(record: GameRecord): string {
  return JSON.stringify(record, null, 2);
}
