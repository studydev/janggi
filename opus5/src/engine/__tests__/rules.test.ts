import { describe, expect, it } from 'vitest';
import { pieceAt } from '../board';
import {
  createGame,
  generateLegalMoves,
  generateLegalTargets,
  isAttacked,
  isCheck,
  isLegalMove,
  makeMove,
  pass,
  undoMove,
} from '../rules';
import { at, buildState, includesPosition } from './testUtils';

describe('공격 판정', () => {
  it('차의 진로에 있는 지점은 공격받는다', () => {
    const state = buildState([
      { side: 'CHO', type: 'CHA', file: 5, rank: 8 },
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
    ]);
    expect(isAttacked(state.board, at(5, 2), 'CHO')).toBe(true);
    expect(isAttacked(state.board, at(4, 2), 'CHO')).toBe(false);
  });

  it('포의 공격 판정은 이동 규칙과 같다(포대 1개 필요)', () => {
    const noScreen = buildState([
      { side: 'CHO', type: 'PO', file: 5, rank: 8 },
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
    ]);
    expect(isAttacked(noScreen.board, at(5, 2), 'CHO')).toBe(false);

    const withScreen = buildState([
      { side: 'CHO', type: 'PO', file: 5, rank: 8 },
      { side: 'CHO', type: 'JOL', file: 5, rank: 5 },
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
    ]);
    expect(isAttacked(withScreen.board, at(5, 2), 'CHO')).toBe(true);
  });
});

describe('장군과 합법수', () => {
  it('궁이 공격받으면 장군이다', () => {
    const state = buildState([
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      { side: 'CHO', type: 'CHA', file: 4, rank: 2 },
    ]);
    expect(isCheck(state, 'HAN')).toBe(true);
    expect(isCheck(state, 'CHO')).toBe(false);
  });

  it('자기 궁이 노출되는 수는 합법수에서 빠진다', () => {
    const state = buildState(
      [
        { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
        { side: 'HAN', type: 'MA', file: 5, rank: 5 },
        { side: 'CHO', type: 'CHA', file: 5, rank: 8 },
        { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      ],
      'HAN',
    );
    const pinned = generateLegalMoves(state).filter((m) => m.from.file === 5 && m.from.rank === 5);
    expect(pinned).toHaveLength(0);
    expect(generateLegalTargets(state, at(5, 5))).toHaveLength(0);
  });

  it('장군을 받으면 해소하는 수만 남는다', () => {
    const state = buildState(
      [
        { side: 'HAN', type: 'GUNG', file: 5, rank: 1 },
        { side: 'HAN', type: 'CHA', file: 9, rank: 3 },
        { side: 'CHO', type: 'CHA', file: 5, rank: 5 },
        { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
      ],
      'HAN',
    );
    const moves = generateLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) {
      const next = makeMove(state, move);
      expect(isCheck(next, 'HAN')).toBe(false);
    }
    expect(isLegalMove(state, { from: at(9, 3), to: at(5, 3) })).toBe(true);
    expect(isLegalMove(state, { from: at(9, 3), to: at(9, 5) })).toBe(false);
  });
});

describe('착수', () => {
  it('makeMove는 원본을 바꾸지 않고 새 상태를 만든다', () => {
    const state = createGame();
    const before = JSON.stringify(state);
    const next = makeMove(state, { from: at(1, 7), to: at(1, 6) });

    expect(JSON.stringify(state)).toBe(before);
    expect(next.turn).toBe('HAN');
    expect(pieceAt(next.board, at(1, 6))).toEqual({ side: 'CHO', type: 'JOL' });
    expect(pieceAt(next.board, at(1, 7))).toBeNull();
    expect(next.moveHistory).toHaveLength(1);
  });

  it('잡은 기물을 기록한다', () => {
    const state = buildState([
      { side: 'CHO', type: 'CHA', file: 5, rank: 8 },
      { side: 'HAN', type: 'MA', file: 5, rank: 4 },
      { side: 'HAN', type: 'GUNG', file: 5, rank: 2 },
      { side: 'CHO', type: 'GUNG', file: 5, rank: 9 },
    ]);
    const next = makeMove(state, { from: at(5, 8), to: at(5, 4) });
    expect(next.capturedPieces.CHO).toEqual(['MA']);
    expect(next.moveHistory[0].captured).toBe('MA');
  });

  it('규칙에 어긋난 착수는 거부한다', () => {
    const state = createGame();
    expect(() => makeMove(state, { from: at(1, 7), to: at(1, 5) })).toThrow();
    expect(() => makeMove(state, { from: at(1, 4), to: at(1, 5) })).toThrow(); // 한의 기물
    expect(() => makeMove(state, { from: at(5, 5), to: at(5, 4) })).toThrow(); // 빈 지점
  });

  it('한 수 쉬기는 보드를 그대로 두고 차례만 넘긴다', () => {
    const state = createGame();
    const next = pass(state);
    expect(next.board).toEqual(state.board);
    expect(next.turn).toBe('HAN');
    expect(next.moveHistory[0].isPass).toBe(true);
  });

  it('undo는 착수 직전 상태와 완전히 같다', () => {
    const state = createGame();
    const moved = makeMove(state, { from: at(1, 7), to: at(1, 6) });
    expect(undoMove(moved)).toEqual(state);

    const passed = pass(moved);
    expect(undoMove(passed)).toEqual(moved);
  });

  it('선수는 초(楚)다', () => {
    expect(createGame().turn).toBe('CHO');
  });

  it('합법 지점 목록과 실제 착수 가능 여부가 일치한다', () => {
    const state = createGame();
    const targets = generateLegalTargets(state, at(2, 10));
    expect(includesPosition(targets, at(1, 8))).toBe(true);
    expect(includesPosition(targets, at(3, 8))).toBe(true);
    for (const to of targets) {
      expect(() => makeMove(state, { from: at(2, 10), to })).not.toThrow();
    }
  });
});
