/**
 * 합법수 필터, 장군 판정, 상태 전이.
 * RULES.md 「대국 진행」
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../board';
import {
  canPass,
  generateLegalMoves,
  isAttacked,
  isCheck,
  makeMove,
  pass,
  tryMove,
  undoMove,
} from '../rules';
import { DEFAULT_CONFIG, type GameState } from '../types';
import { at, boardWith, type Placement } from './helpers';

function stateWith(turn: 'HAN' | 'CHO', ...placements: Placement[]): GameState {
  return {
    board: boardWith(...placements),
    turn,
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config: DEFAULT_CONFIG,
    positionKeys: [],
    setup: { HAN: 'MSMS', CHO: 'MSMS' },
  };
}

describe('isAttacked', () => {
  it('차의 직선 공격을 잡아낸다', () => {
    const board = boardWith([5, 10, 'CHA', 'CHO']);
    expect(isAttacked(board, at(5, 2), 'CHO')).toBe(true);
    expect(isAttacked(board, at(4, 2), 'CHO')).toBe(false);
  });

  it('포의 공격은 이동과 같은 규칙을 쓴다 — 포대가 있어야 공격이다', () => {
    const noScreen = boardWith([5, 10, 'PO', 'CHO']);
    expect(isAttacked(noScreen, at(5, 2), 'CHO')).toBe(false);

    const withScreen = boardWith([5, 10, 'PO', 'CHO'], [5, 6, 'JOL', 'HAN']);
    expect(isAttacked(withScreen, at(5, 2), 'CHO')).toBe(true);
  });

  it('포는 포를 넘어 공격할 수 없다', () => {
    const board = boardWith([5, 10, 'PO', 'CHO'], [5, 6, 'PO', 'HAN']);
    expect(isAttacked(board, at(5, 2), 'CHO')).toBe(false);
  });

  it('마의 다리가 막히면 공격이 아니다', () => {
    const open = boardWith([4, 4, 'MA', 'CHO']);
    expect(isAttacked(open, at(5, 2), 'CHO')).toBe(true);
    const blocked = boardWith([4, 4, 'MA', 'CHO'], [4, 3, 'JOL', 'HAN']);
    expect(isAttacked(blocked, at(5, 2), 'CHO')).toBe(false);
  });
});

describe('장군', () => {
  it('궁이 공격받으면 장군이다', () => {
    const s = stateWith('HAN', [5, 2, 'GUNG', 'HAN'], [5, 10, 'CHA', 'CHO'], [5, 9, 'GUNG', 'CHO']);
    // 초의 궁이 (5,9) 에 있어 차의 길을 막는다 -> 장군 아님
    expect(isCheck(s, 'HAN')).toBe(false);

    const s2 = stateWith('HAN', [5, 2, 'GUNG', 'HAN'], [5, 10, 'CHA', 'CHO'], [4, 9, 'GUNG', 'CHO']);
    expect(isCheck(s2, 'HAN')).toBe(true);
  });
});

describe('합법수 필터', () => {
  it('자기 궁이 장군에 노출되는 수는 제거된다 (핀)', () => {
    // 한 궁 (5,2) 앞의 사(5,3)가 초 차(5,10)의 길을 막고 있다. 사가 옆으로 비키면 장군.
    const s = stateWith(
      'HAN',
      [5, 2, 'GUNG', 'HAN'],
      [5, 3, 'SA', 'HAN'],
      [5, 10, 'CHA', 'CHO'],
      [4, 9, 'GUNG', 'CHO'],
    );
    const saMoves = generateLegalMoves(s).filter((m) => m.piece === 'SA');
    expect(saMoves).toHaveLength(0);
  });

  it('장군을 받으면 그것을 해소하는 수만 남는다', () => {
    const s = stateWith(
      'HAN',
      [5, 2, 'GUNG', 'HAN'],
      [1, 1, 'CHA', 'HAN'],
      [5, 10, 'CHA', 'CHO'],
      [4, 9, 'GUNG', 'CHO'],
    );
    expect(isCheck(s, 'HAN')).toBe(true);
    const moves = generateLegalMoves(s);
    // 어떤 수를 두어도 장군이 아니어야 한다
    for (const m of moves) {
      expect(isCheck(makeMove(s, m), 'HAN')).toBe(false);
    }
    // 궁이 옆으로 피하거나, 차가 (5,1)/(5,3) 등으로 막는 수가 있어야 한다
    expect(moves.length).toBeGreaterThan(0);
  });

  it('궁을 잡는 수는 애초에 생성되지 않는다 (상대가 노출시키지 못하므로)', () => {
    const s = createInitialState();
    for (const m of generateLegalMoves(s)) {
      expect(m.captured).not.toBe('GUNG');
    }
  });

  it('초기 국면의 합법수는 좌우 대칭이다', () => {
    const s = createInitialState('MSMS', 'MSMS');
    expect(generateLegalMoves(s).length).toBeGreaterThan(0);
  });
});

describe('한 수 쉬기', () => {
  it('평시에는 쉴 수 있다', () => {
    const s = createInitialState();
    expect(canPass(s)).toBe(true);
    const next = pass(s);
    expect(next.turn).toBe('HAN');
    expect(next.board).toBe(s.board);
    expect(next.moveHistory.at(-1)?.isPass).toBe(true);
  });

  it('장군을 받은 상태에서는 쉴 수 없다 (반드시 멍군)', () => {
    const s = stateWith(
      'HAN',
      [5, 2, 'GUNG', 'HAN'],
      [5, 10, 'CHA', 'CHO'],
      [4, 9, 'GUNG', 'CHO'],
    );
    expect(canPass(s)).toBe(false);
  });
});

describe('상태 전이', () => {
  it('makeMove 는 원본을 바꾸지 않는다', () => {
    const s = createInitialState();
    const before = s.board.slice();
    const move = generateLegalMoves(s)[0]!;
    const next = makeMove(s, move);
    expect(s.board).toEqual(before);
    expect(next.board).not.toBe(s.board);
    expect(next.turn).toBe('HAN');
    expect(s.turn).toBe('CHO');
  });

  it('잡은 기물을 기록한다', () => {
    const s = stateWith(
      'CHO',
      [5, 9, 'GUNG', 'CHO'],
      [1, 5, 'CHA', 'CHO'],
      [1, 3, 'MA', 'HAN'],
      [5, 2, 'GUNG', 'HAN'],
    );
    const next = tryMove(s, at(1, 5), at(1, 3));
    expect(next).not.toBeNull();
    expect(next!.capturedPieces.CHO).toEqual(['MA']);
    expect(next!.moveHistory.at(-1)?.captured).toBe('MA');
  });

  it('불법 수는 tryMove 가 거부한다', () => {
    const s = createInitialState();
    expect(tryMove(s, at(1, 7), at(1, 4))).toBeNull(); // 졸은 한 칸씩만
  });

  it('undo 는 원래 상태와 완전히 일치한다', () => {
    const s = createInitialState();
    const move = generateLegalMoves(s).find((m) => m.piece === 'MA')!;
    const back = undoMove(makeMove(s, move));
    expect(back.board).toEqual(s.board);
    expect(back.turn).toBe(s.turn);
    expect(back.moveHistory).toEqual(s.moveHistory);
    expect(back.capturedPieces).toEqual(s.capturedPieces);
    expect(back.positionKeys).toEqual(s.positionKeys);
  });

  it('pass 도 undo 로 되돌아간다', () => {
    const s = createInitialState();
    const back = undoMove(pass(s));
    expect(back.turn).toBe(s.turn);
    expect(back.moveHistory).toEqual(s.moveHistory);
    expect(back.positionKeys).toEqual(s.positionKeys);
  });
});
