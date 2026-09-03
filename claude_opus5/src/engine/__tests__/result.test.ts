/**
 * 외통·빅장·반복·점수 판정.
 * RULES.md 「대국 진행」, 「점수」
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../board';
import {
  calculateScore,
  getGameResult,
  isBikjang,
  isCheckmate,
  mustPass,
  repetitionCount,
} from '../result';
import { generateLegalMoves, isAttacked, makeMove, pass } from '../rules';
import { DEFAULT_CONFIG, type GameConfig, type GameState, type Side } from '../types';
import { boardWith, type Placement } from './helpers';

function stateWith(
  turn: Side,
  placements: Placement[],
  config: GameConfig = DEFAULT_CONFIG,
): GameState {
  return {
    board: boardWith(...placements),
    turn,
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config,
    positionKeys: [],
    setup: { HAN: 'MSMS', CHO: 'MSMS' },
  };
}

describe('외통', () => {
  const mateBoard: Placement[] = [
    [5, 1, 'GUNG', 'HAN'],
    [5, 4, 'CHA', 'CHO'], // (5,1) 장군 + (5,2) 봉쇄
    [4, 3, 'CHA', 'CHO'], // (4,1) 봉쇄
    [6, 3, 'CHA', 'CHO'], // (6,1) 봉쇄
    [5, 10, 'GUNG', 'CHO'],
  ];

  it('장군이면서 합법수가 없으면 외통', () => {
    const s = stateWith('HAN', mateBoard);
    expect(isCheckmate(s, 'HAN')).toBe(true);
    const result = getGameResult(s);
    expect(result.status).toBe('CHECKMATE');
    expect(result.winner).toBe('CHO');
  });

  it('도망갈 곳이 하나라도 있으면 외통이 아니다', () => {
    const s = stateWith('HAN', [
      [5, 1, 'GUNG', 'HAN'],
      [5, 4, 'CHA', 'CHO'], // 장군이지만 (4,1)/(6,1) 은 비어 있다
      [5, 10, 'GUNG', 'CHO'],
    ]);
    expect(isCheckmate(s, 'HAN')).toBe(false);
    expect(getGameResult(s).status).toBe('PLAYING');
  });

  it('궁성 귀퉁이의 차는 중앙을 지나 반대 귀퉁이까지 공격한다', () => {
    // 위 외통 국면이 성립하는 이유: (4,3) 차가 대각선으로 (5,2)를 지나 (6,1)까지 노린다.
    const s = stateWith('HAN', [
      [5, 1, 'GUNG', 'HAN'],
      [4, 3, 'CHA', 'CHO'],
      [5, 10, 'GUNG', 'CHO'],
    ]);
    expect(isAttacked(s.board, { file: 6, rank: 1 }, 'CHO')).toBe(true);
    // 중앙이 막히면 그 대각 공격은 사라진다
    const blocked = stateWith('HAN', [
      [5, 1, 'GUNG', 'HAN'],
      [4, 3, 'CHA', 'CHO'],
      [5, 2, 'SA', 'HAN'],
      [5, 10, 'GUNG', 'CHO'],
    ]);
    expect(isAttacked(blocked.board, { file: 6, rank: 1 }, 'CHO')).toBe(false);
  });

  it('장군이 아닌데 수가 없으면 외통이 아니라 한 수 쉼이다 (스테일메이트 없음)', () => {
    // 한의 궁이 자기 사 4개에 완전히 둘러싸인 상황: 움직일 수는 없지만 장군은 아니다.
    const s = stateWith('HAN', [
      [5, 2, 'GUNG', 'HAN'],
      [4, 1, 'SA', 'HAN'],
      [5, 1, 'SA', 'HAN'],
      [6, 1, 'SA', 'HAN'],
      [4, 2, 'SA', 'HAN'],
      [6, 2, 'SA', 'HAN'],
      [4, 3, 'SA', 'HAN'],
      [5, 3, 'SA', 'HAN'],
      [6, 3, 'SA', 'HAN'],
      [1, 10, 'GUNG', 'CHO'],
    ]);
    expect(isCheckmate(s, 'HAN')).toBe(false);
    expect(mustPass(s)).toBe(true);
    expect(getGameResult(s).status).toBe('PLAYING');
  });
});

describe('빅장', () => {
  it('같은 줄에서 사이가 비면 빅장', () => {
    const s = stateWith('CHO', [
      [5, 2, 'GUNG', 'HAN'],
      [5, 9, 'GUNG', 'CHO'],
    ]);
    expect(isBikjang(s)).toBe(true);
    const result = getGameResult(s);
    expect(result.status).toBe('DRAW_BY_SCORE');
    expect(result.reason).toBe('BIKJANG');
  });

  it('사이에 기물이 있으면 빅장이 아니다', () => {
    const s = stateWith('CHO', [
      [5, 2, 'GUNG', 'HAN'],
      [5, 5, 'JOL', 'CHO'],
      [5, 9, 'GUNG', 'CHO'],
    ]);
    expect(isBikjang(s)).toBe(false);
  });

  it('다른 줄이면 빅장이 아니다', () => {
    const s = stateWith('CHO', [
      [4, 2, 'GUNG', 'HAN'],
      [5, 9, 'GUNG', 'CHO'],
    ]);
    expect(isBikjang(s)).toBe(false);
  });

  it('설정으로 끌 수 있다', () => {
    const s = stateWith(
      'CHO',
      [
        [5, 2, 'GUNG', 'HAN'],
        [5, 9, 'GUNG', 'CHO'],
      ],
      { ...DEFAULT_CONFIG, bikjangEnabled: false },
    );
    expect(isBikjang(s)).toBe(true);
    expect(getGameResult(s).status).toBe('PLAYING');
  });
});

describe('국면 반복', () => {
  it('서로 한 수씩 쉬면 같은 국면이 반복되어 비김으로 간다', () => {
    let s = createInitialState();
    expect(repetitionCount(s)).toBe(1);
    s = pass(s); // 초 쉼 -> 한 차례
    s = pass(s); // 한 쉼 -> 초 차례 (초기 국면 재현)
    expect(repetitionCount(s)).toBe(2);
    s = pass(s);
    s = pass(s);
    expect(repetitionCount(s)).toBe(3);
    const result = getGameResult(s);
    expect(result.status).toBe('DRAW_BY_SCORE');
    expect(result.reason).toBe('REPETITION');
  });
});

describe('점수', () => {
  it('초기 총점은 초 72, 한 73.5(덤 1.5 포함)', () => {
    const s = createInitialState();
    expect(calculateScore(s, 'CHO')).toBe(72);
    expect(calculateScore(s, 'HAN')).toBe(73.5);
  });

  it('기물을 잃으면 그만큼 점수가 준다', () => {
    let s = createInitialState();
    // 초 졸(1,7) -> (1,6) -> ... 대신, 직접 구성한 국면으로 확인
    const before = calculateScore(s, 'HAN');
    s = stateWith('CHO', [
      [5, 2, 'GUNG', 'HAN'],
      [1, 1, 'CHA', 'HAN'],
      [5, 9, 'GUNG', 'CHO'],
    ]);
    expect(calculateScore(s, 'HAN')).toBe(13 + 1.5);
    expect(before).toBe(73.5);
  });

  it('무승부 조건에서는 점수가 높은 쪽이 이긴다', () => {
    const s = stateWith('CHO', [
      [5, 2, 'GUNG', 'HAN'],
      [5, 9, 'GUNG', 'CHO'],
      [1, 5, 'CHA', 'CHO'],
    ]);
    const result = getGameResult(s); // 빅장
    expect(result.status).toBe('DRAW_BY_SCORE');
    expect(result.scores.CHO).toBe(13);
    expect(result.scores.HAN).toBe(1.5);
    expect(result.winner).toBe('CHO');
  });
});

describe('수 제한', () => {
  it('maxPlies 를 넘으면 점수로 마무리한다', () => {
    const start = createInitialState('MSMS', 'MSMS', {
      ...DEFAULT_CONFIG,
      maxPlies: 2,
      repetitionLimit: 99,
    });
    const afterFirst = makeMove(start, generateLegalMoves(start)[0]!);
    const afterSecond = makeMove(afterFirst, generateLegalMoves(afterFirst)[0]!);
    expect(afterSecond.moveHistory).toHaveLength(2);
    expect(getGameResult(afterSecond).reason).toBe('MOVE_LIMIT');
  });
});
