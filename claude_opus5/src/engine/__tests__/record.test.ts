/** 기보 직렬화·복원·리플레이 (P9). */
import { describe, expect, it } from 'vitest';
import { createInitialState, positionKey } from '../board';
import {
  parseRecord,
  RecordParseError,
  recordToJson,
  replayMoves,
  stateAtPly,
  stateFromRecord,
  toRecord,
} from '../record';
import { generateLegalMoves, makeMove, pass } from '../rules';
import { playRandomGame } from '../selfplay';
import type { GameState } from '../types';

function playSome(n: number): GameState {
  let state = createInitialState('MSSM', 'SMMS');
  for (let i = 0; i < n; i++) {
    const moves = generateLegalMoves(state);
    if (moves.length === 0) {
      state = pass(state);
      continue;
    }
    state = makeMove(state, moves[i % moves.length]!);
  }
  return state;
}

describe('기보 저장과 복원', () => {
  it('JSON 으로 내보냈다 불러오면 같은 국면이 나온다', () => {
    const original = playSome(24);
    const json = recordToJson(toRecord(original));
    const { state, appliedPlies } = stateFromRecord(parseRecord(JSON.parse(json)));

    expect(appliedPlies).toBe(original.moveHistory.length);
    expect(positionKey(state)).toBe(positionKey(original));
    expect(state.board).toEqual(original.board);
    expect(state.capturedPieces).toEqual(original.capturedPieces);
    expect(state.setup).toEqual(original.setup);
  });

  it('한 수 쉬기가 섞여 있어도 복원된다', () => {
    let state = createInitialState();
    state = pass(state);
    state = makeMove(state, generateLegalMoves(state)[0]!);
    state = pass(state);

    const { state: restored } = stateFromRecord(parseRecord(JSON.parse(recordToJson(toRecord(state)))));
    expect(positionKey(restored)).toBe(positionKey(state));
    expect(restored.moveHistory.filter((m) => m.isPass)).toHaveLength(2);
  });

  it('랜덤 대국 전체도 그대로 복원된다', () => {
    for (const seed of [3, 17, 42]) {
      const { finalState } = playRandomGame(seed, { validate: false });
      const { state } = stateFromRecord(parseRecord(JSON.parse(recordToJson(toRecord(finalState)))));
      expect(positionKey(state)).toBe(positionKey(finalState));
    }
  });

  it('망가진 기보는 명확히 거절한다', () => {
    expect(() => parseRecord(null)).toThrow(RecordParseError);
    expect(() => parseRecord({ setup: { HAN: 'XXXX', CHO: 'MSMS' }, moves: [] })).toThrow(
      RecordParseError,
    );
    expect(() => parseRecord({ setup: { HAN: 'MSMS', CHO: 'MSMS' } })).toThrow(RecordParseError);
  });

  it('규칙에 맞지 않는 수가 섞이면 그 앞까지만 복원한다', () => {
    const good = toRecord(playSome(4));
    const broken = {
      ...good,
      moves: [
        ...good.moves.slice(0, 2),
        { from: { file: 1, rank: 1 }, to: { file: 9, rank: 9 }, piece: 'CHA', side: 'CHO', captured: null, isPass: false },
      ],
    };
    const { appliedPlies } = stateFromRecord(parseRecord(broken));
    expect(appliedPlies).toBeLessThanOrEqual(3);
  });
});

describe('리플레이', () => {
  it('stateAtPly 는 그 시점까지만 둔 상태를 만든다', () => {
    const state = playSome(10);
    for (let ply = 0; ply <= 10; ply++) {
      const at = stateAtPly(state, ply);
      expect(at.moveHistory).toHaveLength(ply);
      expect(positionKey(at)).toBe(
        positionKey(replayMoves(state.setup, state.config, state.moveHistory, ply)),
      );
    }
  });

  it('마지막 시점은 원래 상태와 같다', () => {
    const state = playSome(12);
    expect(positionKey(stateAtPly(state, 12))).toBe(positionKey(state));
  });

  it('범위를 벗어난 ply 는 잘라낸다', () => {
    const state = playSome(5);
    expect(stateAtPly(state, 99).moveHistory).toHaveLength(5);
    expect(stateAtPly(state, -3).moveHistory).toHaveLength(0);
  });
});
