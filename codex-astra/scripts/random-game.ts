/**
 * Seeded property exercise, not AI. Run: npm run validate:random
 * Every generated candidate is checked against independent basic invariants.
 * At 160 plies, games still ongoing are explicitly ended by agreed score
 * adjudication to keep this stress test finite. This is a harness policy;
 * the game engine and UI impose no move limit.
 */
import assert from 'node:assert/strict';
import {
  SETUPS, agreeDraw, createGame, forwardDir, fromIndex, generateLegalMoves,
  isCheck, isInBoard, isInPalace, makeMove, pass, pieceAt, toIndex, undo,
} from '../src/engine/index';
import type { GameState, Move, Piece, Position } from '../src/engine/types';

const games = Number(process.argv[2] ?? 1000);
assert(Number.isInteger(games) && games >= 1 && games <= 100000, '판 수는 1~100000 정수여야 합니다.');
const MAX_PLIES = 160;
const SEED = 0x4a414e47;
let randomState = SEED;
const random = () => {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 4294967296;
};

function validatePosition(state: GameState): void {
  assert.equal(state.board.length, 90, '장기판 크기 변경');
  const living = state.board.filter((piece): piece is Piece => piece !== null);
  assert.equal(living.filter(piece => piece.type === 'GUNG' && piece.side === 'HAN').length, 1, '한 궁 소실');
  assert.equal(living.filter(piece => piece.type === 'GUNG' && piece.side === 'CHO').length, 1, '초 궁 소실');
  assert.equal(living.length + state.capturedPieces.length, 32, '기물 수 보존 위반');
  assert.equal(new Set([...living, ...state.capturedPieces].map(piece => piece.id)).size, 32, '기물 중복');
  state.board.forEach((piece, index) => {
    if (!piece) return;
    const pos = fromIndex(index);
    assert(isInBoard(pos), '보드 밖 기물');
    if (piece.type === 'GUNG' || piece.type === 'SA') assert(isInPalace(pos, piece.side), '궁/사 궁성 이탈');
  });
}

function validateCandidate(state: GameState, move: Move): void {
  assert(isInBoard(move.from) && isInBoard(move.to), '보드 밖 이동');
  const piece = pieceAt(state.board, move.from)!;
  assert(piece && piece.side === state.turn, '다른 진영의 기물 이동');
  const target = pieceAt(state.board, move.to);
  assert(target?.type !== 'GUNG', '궁을 잡는 수 생성');
  assert(target?.side !== piece.side, '아군을 잡는 수 생성');
  if (piece.type === 'GUNG' || piece.type === 'SA') assert(isInPalace(move.to, piece.side), '궁/사 궁성 이탈 수');
  if (piece.type === 'JOL') assert((move.to.rank - move.from.rank) * forwardDir(piece.side) >= 0, '졸/병 후진');
  if (piece.type === 'PO') {
    assert(target?.type !== 'PO', '포끼리 잡는 수');
    const df = move.to.file - move.from.file, dr = move.to.rank - move.from.rank;
    assert(df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr), '잘못된 포 경로');
    const steps = Math.max(Math.abs(df), Math.abs(dr));
    const screens: Piece[] = [];
    for (let step = 1; step < steps; step++) {
      const pos: Position = { file: move.from.file + Math.sign(df) * step, rank: move.from.rank + Math.sign(dr) * step };
      const screen = pieceAt(state.board, pos);
      if (screen) screens.push(screen);
    }
    assert.equal(screens.length, 1, '포대가 정확히 한 개가 아님');
    assert(screens[0]?.type !== 'PO', '포를 포대로 사용');
  }
}

let plies = 0, candidates = 0, cappedGames = 0;
const results: Record<string, number> = {};
const startedAt = Date.now();
for (let gameIndex = 0; gameIndex < games; gameIndex++) {
  // Cycle all 16 combinations evenly and exercise both bikjang settings.
  let state = createGame(SETUPS[gameIndex % 4]!, SETUPS[Math.floor(gameIndex / 4) % 4]!, { bikjang: gameIndex % 2 === 0 });
  validatePosition(state);
  while (!state.result && state.moveHistory.length < MAX_PLIES) {
    const moves = generateLegalMoves(state);
    for (const move of moves) validateCandidate(state, move);
    candidates += moves.length;
    const before = JSON.stringify(state);
    const wasInCheck = isCheck(state, state.turn);
    assert(moves.length > 0 || !wasInCheck, '외통인데 대국이 계속됨');
    const next = !wasInCheck && (moves.length === 0 || random() < 0.03)
      ? pass(state)
      : makeMove(state, moves[Math.floor(random() * moves.length)]!);
    assert.equal(JSON.stringify(state), before, '원본 상태 변경');
    assert.deepEqual(undo(next), state, 'makeMove/pass 뒤 undo 불일치');
    assert(!isCheck(next, state.turn), '자기 궁을 장군에 노출');
    validatePosition(next);
    const last = next.moveHistory.at(-1)!;
    if (!last.isPass) assert.equal(next.board[toIndex(last.to!)], last.piece, '이동 기록 불일치');
    state = next;
    plies++;
  }
  if (!state.result) {
    cappedGames++;
    state = agreeDraw(state);
  }
  assert(state.result && state.result.status !== 'PLAYING', '대국이 종료되지 않음');
  assert.equal(generateLegalMoves(state).length, 0, '종료 뒤 합법수 생성');
  results[state.result.reason] = (results[state.result.reason] ?? 0) + 1;
  if ((gameIndex + 1) % 100 === 0) console.log(`${gameIndex + 1}/${games}판 통과 · ${plies}수 · 합법수 ${candidates}개 검증`);
}
console.log(JSON.stringify({ games, seed: SEED, maxPlies: MAX_PLIES, plies, candidates, cappedGames, results, seconds: (Date.now() - startedAt) / 1000 }, null, 2));
