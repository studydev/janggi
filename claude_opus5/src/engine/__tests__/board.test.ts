/**
 * 좌표계, 궁성 기하, 초기 배치.
 * RULES.md 「보드」, 「초기 배치」
 */
import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  createInitialBoard,
  createInitialState,
  findGung,
  forwardDir,
  fromIndex,
  isInBoard,
  isInPalace,
  isOnPalaceDiagonal,
  nextOnPalaceDiagonal,
  palaceDiagonalNeighbors,
  pieceAt,
  toIndex,
} from '../board';
import { at } from './helpers';

describe('좌표', () => {
  it('9열 × 10행 = 90 교차점', () => {
    expect(BOARD_SIZE).toBe(90);
  });

  it('toIndex / fromIndex 는 서로의 역함수다', () => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      expect(toIndex(fromIndex(i))).toBe(i);
    }
  });

  it('보드 범위 판정', () => {
    expect(isInBoard(at(1, 1))).toBe(true);
    expect(isInBoard(at(9, 10))).toBe(true);
    expect(isInBoard(at(0, 5))).toBe(false);
    expect(isInBoard(at(10, 5))).toBe(false);
    expect(isInBoard(at(5, 11))).toBe(false);
  });
});

describe('궁성', () => {
  it('한 궁성 = file 4~6 / rank 1~3, 초 궁성 = file 4~6 / rank 8~10', () => {
    expect(isInPalace(at(4, 1), 'HAN')).toBe(true);
    expect(isInPalace(at(6, 3), 'HAN')).toBe(true);
    expect(isInPalace(at(5, 4), 'HAN')).toBe(false);
    expect(isInPalace(at(5, 9), 'CHO')).toBe(true);
    expect(isInPalace(at(5, 9), 'HAN')).toBe(false);
  });

  it('대각선 위 지점은 네 귀퉁이와 중앙뿐이다', () => {
    expect(isOnPalaceDiagonal(at(5, 2))).toBe(true);
    expect(isOnPalaceDiagonal(at(4, 1))).toBe(true);
    expect(isOnPalaceDiagonal(at(6, 3))).toBe(true);
    expect(isOnPalaceDiagonal(at(4, 2))).toBe(false); // 변 중앙
    expect(isOnPalaceDiagonal(at(5, 1))).toBe(false);
    expect(isOnPalaceDiagonal(at(5, 5))).toBe(false); // 궁성 밖
  });

  it('귀퉁이는 중앙과만, 중앙은 네 귀퉁이와 이어진다', () => {
    expect(palaceDiagonalNeighbors(at(4, 1))).toEqual([at(5, 2)]);
    expect(palaceDiagonalNeighbors(at(5, 2))).toHaveLength(4);
    expect(palaceDiagonalNeighbors(at(4, 2))).toEqual([]);
  });

  it('대각선은 궁성 밖으로 이어지지 않는다', () => {
    expect(nextOnPalaceDiagonal(at(4, 3), 1, -1)).toEqual(at(5, 2));
    expect(nextOnPalaceDiagonal(at(4, 3), -1, 1)).toBeNull();
    expect(nextOnPalaceDiagonal(at(5, 2), 1, 1)).toEqual(at(6, 3));
    expect(nextOnPalaceDiagonal(at(6, 3), 1, 1)).toBeNull();
  });
});

describe('전진 방향', () => {
  it('한은 rank 증가, 초는 rank 감소가 전진', () => {
    expect(forwardDir('HAN')).toBe(1);
    expect(forwardDir('CHO')).toBe(-1);
  });
});

describe('초기 배치', () => {
  it('RULES.md 배치와 일치한다 (한 진영)', () => {
    const board = createInitialBoard('MSMS', 'MSMS');
    expect(pieceAt(board, at(1, 1))).toEqual({ type: 'CHA', side: 'HAN' });
    expect(pieceAt(board, at(2, 1))).toEqual({ type: 'MA', side: 'HAN' });
    expect(pieceAt(board, at(3, 1))).toEqual({ type: 'SANG', side: 'HAN' });
    expect(pieceAt(board, at(4, 1))).toEqual({ type: 'SA', side: 'HAN' });
    expect(pieceAt(board, at(5, 1))).toBeNull();
    expect(pieceAt(board, at(6, 1))).toEqual({ type: 'SA', side: 'HAN' });
    expect(pieceAt(board, at(9, 1))).toEqual({ type: 'CHA', side: 'HAN' });
    expect(pieceAt(board, at(5, 2))).toEqual({ type: 'GUNG', side: 'HAN' });
    expect(pieceAt(board, at(2, 3))).toEqual({ type: 'PO', side: 'HAN' });
    expect(pieceAt(board, at(8, 3))).toEqual({ type: 'PO', side: 'HAN' });
    for (const f of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, at(f, 4))).toEqual({ type: 'JOL', side: 'HAN' });
    }
  });

  it('초 진영은 상하 대칭이다', () => {
    const board = createInitialBoard('MSMS', 'MSMS');
    expect(pieceAt(board, at(1, 10))).toEqual({ type: 'CHA', side: 'CHO' });
    expect(pieceAt(board, at(5, 10))).toBeNull();
    expect(pieceAt(board, at(5, 9))).toEqual({ type: 'GUNG', side: 'CHO' });
    expect(pieceAt(board, at(2, 8))).toEqual({ type: 'PO', side: 'CHO' });
    for (const f of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, at(f, 7))).toEqual({ type: 'JOL', side: 'CHO' });
    }
  });

  it('마·상 배치 4종이 file 2,3,7,8 에 반영된다', () => {
    const board = createInitialBoard('SMMS', 'MSSM');
    expect(pieceAt(board, at(2, 1))?.type).toBe('SANG');
    expect(pieceAt(board, at(3, 1))?.type).toBe('MA');
    expect(pieceAt(board, at(7, 1))?.type).toBe('MA');
    expect(pieceAt(board, at(8, 1))?.type).toBe('SANG');

    expect(pieceAt(board, at(2, 10))?.type).toBe('MA');
    expect(pieceAt(board, at(3, 10))?.type).toBe('SANG');
    expect(pieceAt(board, at(7, 10))?.type).toBe('SANG');
    expect(pieceAt(board, at(8, 10))?.type).toBe('MA');
  });

  it('양쪽 각 16기물, 궁 위치, 선수는 초', () => {
    const state = createInitialState();
    expect(state.board.filter((s) => s?.side === 'HAN')).toHaveLength(16);
    expect(state.board.filter((s) => s?.side === 'CHO')).toHaveLength(16);
    expect(findGung(state.board, 'HAN')).toEqual(at(5, 2));
    expect(findGung(state.board, 'CHO')).toEqual(at(5, 9));
    expect(state.turn).toBe('CHO');
  });
});
