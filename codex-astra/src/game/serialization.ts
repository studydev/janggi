import { agreeDraw, createGame, makeMove, pass, resign } from '../engine';
import type { GameConfig, GameResult, GameState, MoveRecord, Piece, PieceType, Position, Setup, Side } from '../engine/types';

export const RECORD_VERSION = 1;
export const MAX_RECORD_BYTES = 2 * 1024 * 1024;
export const MAX_RECORD_MOVES = 2_000;
export const MAX_ELAPSED_SECONDS = 365 * 24 * 60 * 60;

const SETUPS: readonly Setup[] = ['MASANGMASANG', 'SANGMASANGMA', 'MASANGSANGMA', 'SANGMAMASANG'];
const PIECE_TYPES: readonly PieceType[] = ['GUNG', 'SA', 'CHA', 'PO', 'MA', 'SANG', 'JOL'];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function side(value: unknown): value is Side {
  return value === 'HAN' || value === 'CHO';
}

function setup(value: unknown): value is Setup {
  return typeof value === 'string' && SETUPS.some((candidate) => candidate === value);
}

function readPosition(value: unknown): Position {
  assert(object(value) && integer(value.file, 1, 9) && integer(value.rank, 1, 10), '기보에 잘못된 좌표가 있습니다.');
  return { file: value.file, rank: value.rank };
}

function readPiece(value: unknown): Piece | null {
  if (value === null) return null;
  assert(object(value) && typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 100
    && side(value.side) && PIECE_TYPES.some((type) => type === value.type), '기보에 잘못된 기물 정보가 있습니다.');
  return { id: value.id, side: value.side, type: value.type as PieceType };
}

function readRecord(value: unknown): MoveRecord {
  assert(object(value) && typeof value.isPass === 'boolean' && side(value.side), '기보의 수 형식이 올바르지 않습니다.');
  const piece = readPiece(value.piece);
  const captured = readPiece(value.captured);
  if (value.isPass) {
    assert(value.from === null && value.to === null && piece === null && captured === null, '한 수 쉼 기보가 올바르지 않습니다.');
    return { from: null, to: null, piece: null, captured: null, isPass: true, side: value.side };
  }
  assert(piece !== null, '기보에 움직인 기물 정보가 없습니다.');
  return { from: readPosition(value.from), to: readPosition(value.to), piece, captured, isPass: false, side: value.side };
}

function readConfig(value: unknown): GameConfig {
  assert(object(value) && typeof value.bikjang === 'boolean'
    && integer(value.repetitionCount, 2, 10), '기보의 규칙 설정이 올바르지 않습니다.');
  return { bikjang: value.bikjang, repetitionCount: value.repetitionCount };
}

function readResult(value: unknown): GameResult | null {
  if (value === null) return null;
  assert(object(value) && (value.status === 'CHECKMATE' || value.status === 'DRAW_BY_SCORE' || value.status === 'RESIGNED')
    && (value.winner === null || side(value.winner)) && typeof value.reason === 'string'
    && value.reason.length > 0 && value.reason.length <= 200, '기보의 종료 정보가 올바르지 않습니다.');
  return { status: value.status, winner: value.winner, reason: value.reason };
}

function samePiece(a: Piece | null, b: Piece | null): boolean {
  return a === null || b === null ? a === b : a.id === b.id && a.side === b.side && a.type === b.type;
}

function samePosition(a: Position | null, b: Position | null): boolean {
  return a === null || b === null ? a === b : a.file === b.file && a.rank === b.rank;
}

function sameRecord(a: MoveRecord, b: MoveRecord): boolean {
  return a.isPass === b.isPass && a.side === b.side && samePosition(a.from, b.from)
    && samePosition(a.to, b.to) && samePiece(a.piece, b.piece) && samePiece(a.captured, b.captured);
}

function sameResult(a: GameResult | null, b: GameResult | null): boolean {
  return a === null || b === null ? a === b : a.status === b.status && a.winner === b.winner && a.reason === b.reason;
}

function applyRecord(game: GameState, record: MoveRecord): GameState {
  if (record.isPass) return pass(game);
  assert(record.from && record.to, '기보의 수 좌표가 없습니다.');
  return makeMove(game, { from: record.from, to: record.to });
}

/** Persist replay inputs. Boards and captures are always reconstructed by the engine. */
export function serializeGame(game: GameState, elapsedSeconds: number): string {
  assert(integer(elapsedSeconds, 0, MAX_ELAPSED_SECONDS), '경과 시간이 올바르지 않습니다.');
  assert(game.moveHistory.length <= MAX_RECORD_MOVES, `기보는 최대 ${MAX_RECORD_MOVES}수까지 저장할 수 있습니다.`);
  const text = JSON.stringify({
    format: 'janggi-record',
    version: RECORD_VERSION,
    hanSetup: game.hanSetup,
    choSetup: game.choSetup,
    config: game.config,
    elapsedSeconds,
    moves: game.moveHistory,
    result: game.result,
  }, null, 2);
  assert(new TextEncoder().encode(text).length <= MAX_RECORD_BYTES, '기보 파일이 너무 큽니다. 최대 2MB까지 지원합니다.');
  return text;
}

/** Validate all untrusted data and every move before returning an engine-owned state. */
export function deserializeGame(text: string): { game: GameState; elapsedSeconds: number } {
  assert(typeof text === 'string' && text.length <= MAX_RECORD_BYTES
    && new TextEncoder().encode(text).length <= MAX_RECORD_BYTES, '기보 파일이 너무 큽니다. 최대 2MB까지 지원합니다.');
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('JSON 형식의 장기 기보 파일을 선택해 주세요.'); }
  assert(object(data) && data.format === 'janggi-record' && data.version === RECORD_VERSION, '지원하지 않는 기보 형식 또는 버전입니다.');
  assert(setup(data.hanSetup) && setup(data.choSetup), '기보의 마상 배치가 올바르지 않습니다.');
  const config = readConfig(data.config);
  assert(integer(data.elapsedSeconds, 0, MAX_ELAPSED_SECONDS), '기보의 경과 시간이 올바르지 않습니다.');
  assert(Array.isArray(data.moves) && data.moves.length <= MAX_RECORD_MOVES, `기보는 최대 ${MAX_RECORD_MOVES}수까지 불러올 수 있습니다.`);
  const expectedResult = readResult(data.result);
  let game = createGame(data.hanSetup, data.choSetup, config);
  for (let index = 0; index < data.moves.length; index += 1) {
    const record = readRecord(data.moves[index]);
    assert(!game.result, `${index + 1}번째 수는 이미 종료된 대국 이후에 기록되어 있습니다.`);
    assert(record.side === game.turn, `${index + 1}번째 수의 차례가 올바르지 않습니다.`);
    try { game = applyRecord(game, record); } catch {
      throw new Error(`${index + 1}번째 수는 장기 규칙에 맞지 않습니다.`);
    }
    const actual = game.moveHistory[game.moveHistory.length - 1];
    assert(actual && sameRecord(actual, record), `${index + 1}번째 수의 기물 또는 잡은 기물 정보가 일치하지 않습니다.`);
  }
  // Resignation and agreement are actions outside the move list; validate their outcomes too.
  if (!game.result && expectedResult) {
    if (expectedResult.status === 'RESIGNED' && expectedResult.winner) {
      game = resign(game, expectedResult.winner === 'HAN' ? 'CHO' : 'HAN');
    } else if (expectedResult.status === 'DRAW_BY_SCORE') {
      game = agreeDraw(game);
    }
  }
  assert(sameResult(game.result, expectedResult), '기보의 종료 정보가 실제 대국 결과와 일치하지 않습니다.');
  return { game, elapsedSeconds: data.elapsedSeconds };
}

/** Index is the number of plies shown; zero is the initial position. */
export function replayAt(game: GameState, index: number): GameState {
  const target = Math.min(game.moveHistory.length, Math.max(0, Number.isFinite(index) ? Math.floor(index) : 0));
  if (target === game.moveHistory.length) return game;
  let replay = createGame(game.hanSetup, game.choSetup, game.config);
  for (let moveIndex = 0; moveIndex < target; moveIndex += 1) {
    replay = applyRecord(replay, game.moveHistory[moveIndex]!);
  }
  return replay;
}
