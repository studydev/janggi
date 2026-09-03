import { describe, expect, it } from 'vitest';
import { createGame, makeMove } from '../rules';
import {
  calculateScore,
  getGameResult,
  isBikjang,
  isCheckmate,
  isRepetitionDraw,
} from '../result';
import { at, buildState } from './testUtils';

describe('외통', () => {
  const mated = buildState(
    [
      { side: 'HAN', type: 'GUNG', file: 5, rank: 1 },
      { side: 'CHO', type: 'CHA', file: 5, rank: 5 },
      { side: 'CHO', type: 'CHA', file: 4, rank: 7 },
      { side: 'CHO', type: 'CHA', file: 6, rank: 7 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
    ],
    'HAN',
  );

  it('장군이고 합법수가 없으면 외통이다', () => {
    expect(isCheckmate(mated, 'HAN')).toBe(true);
    const result = getGameResult(mated);
    expect(result.status).toBe('CHECKMATE');
    expect(result.winner).toBe('CHO');
  });

  it('장군을 막을 수 있으면 외통이 아니다', () => {
    const escapable = buildState(
      [
        { side: 'HAN', type: 'GUNG', file: 5, rank: 1 },
        { side: 'HAN', type: 'CHA', file: 9, rank: 3 },
        { side: 'CHO', type: 'CHA', file: 5, rank: 5 },
        { side: 'CHO', type: 'CHA', file: 4, rank: 7 },
        { side: 'CHO', type: 'CHA', file: 6, rank: 7 },
        { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      ],
      'HAN',
    );
    expect(isCheckmate(escapable, 'HAN')).toBe(false);
    expect(getGameResult(escapable).status).toBe('PLAYING');
  });

  it('장군이 아닌데 둘 수가 없어도 지지 않는다(스테일메이트 없음)', () => {
    const stuck = buildState(
      [
        { side: 'HAN', type: 'GUNG', file: 5, rank: 1 },
        { side: 'CHO', type: 'CHA', file: 4, rank: 5 },
        { side: 'CHO', type: 'CHA', file: 6, rank: 5 },
        { side: 'CHO', type: 'CHA', file: 1, rank: 2 },
        { side: 'CHO', type: 'GUNG', file: 4, rank: 9 },
      ],
      'HAN',
    );
    expect(isCheckmate(stuck, 'HAN')).toBe(false);
    expect(getGameResult(stuck).status).toBe('PLAYING');
  });
});

describe('빅장', () => {
  it('사이에 기물이 없으면 빅장이다', () => {
    const state = buildState([
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
    ]);
    expect(isBikjang(state)).toBe(true);
    expect(getGameResult(state).status).toBe('DRAW_BY_SCORE');
  });

  it('사이에 기물이 있거나 file이 다르면 빅장이 아니다', () => {
    const blocked = buildState([
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 5 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
    ]);
    expect(isBikjang(blocked)).toBe(false);

    const otherFile = buildState([
      { side: 'HAN', type: 'GUNG', file: 4, rank: 2 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
    ]);
    expect(isBikjang(otherFile)).toBe(false);
  });

  it('설정으로 끌 수 있다', () => {
    const off = buildState(
      [
        { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
        { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      ],
      'CHO',
      { bikjangDraw: false },
    );
    expect(isBikjang(off)).toBe(true);
    expect(getGameResult(off).status).toBe('PLAYING');
  });
});

describe('국면 반복', () => {
  it('같은 국면이 설정 횟수만큼 나오면 무승부 판정한다', () => {
    let state = createGame({ config: { repetitionLimit: 2 } });
    state = makeMove(state, { from: at(2, 10), to: at(1, 8) });
    state = makeMove(state, { from: at(2, 1), to: at(1, 3) });
    expect(isRepetitionDraw(state)).toBe(false);
    state = makeMove(state, { from: at(1, 8), to: at(2, 10) });
    state = makeMove(state, { from: at(1, 3), to: at(2, 1) });

    expect(isRepetitionDraw(state)).toBe(true);
    expect(getGameResult(state).status).toBe('DRAW_BY_SCORE');
  });
});

describe('점수', () => {
  it('초기 점수는 한 73.5점, 초 72점이다', () => {
    const state = createGame();
    expect(calculateScore(state, 'HAN')).toBe(73.5);
    expect(calculateScore(state, 'CHO')).toBe(72);
  });

  it('기물을 잃으면 그만큼 점수가 줄어든다', () => {
    const state = buildState([
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
      { side: 'HAN', type: 'CHA', file: 1, rank: 1 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      { side: 'CHO', type: 'PO', file: 2, rank: 8 },
      { side: 'CHO', type: 'JOL', file: 1, rank: 7 },
    ]);
    expect(calculateScore(state, 'HAN')).toBe(14.5);
    expect(calculateScore(state, 'CHO')).toBe(9);
  });

  it('무승부 조건에서는 점수가 높은 쪽이 이긴다', () => {
    const state = buildState([
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
      { side: 'HAN', type: 'CHA', file: 1, rank: 1 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
    ]);
    const result = getGameResult(state);
    expect(result.status).toBe('DRAW_BY_SCORE');
    expect(result.winner).toBe('HAN');
  });
});
