import { describe, expect, it } from 'vitest';
import {
  createInitialBoard,
  forwardDir,
  isInBoard,
  isInPalace,
  isOnPalaceDiagonal,
  pieceAt,
  renderBoard,
  toIndex,
  toPosition,
} from '../board';
import { at } from './testUtils';

describe('좌표 변환', () => {
  it('index와 Position이 왕복 변환된다', () => {
    for (let i = 0; i < 90; i += 1) {
      expect(toIndex(toPosition(i))).toBe(i);
    }
    expect(toIndex(at(1, 1))).toBe(0);
    expect(toIndex(at(9, 10))).toBe(89);
  });

  it('보드 밖 좌표를 걸러낸다', () => {
    expect(isInBoard(at(1, 1))).toBe(true);
    expect(isInBoard(at(0, 5))).toBe(false);
    expect(isInBoard(at(10, 5))).toBe(false);
    expect(isInBoard(at(5, 11))).toBe(false);
  });
});

describe('궁성', () => {
  it('한은 rank 1~3, 초는 rank 8~10의 file 4~6이다', () => {
    expect(isInPalace(at(5, 2), 'HAN')).toBe(true);
    expect(isInPalace(at(5, 2), 'CHO')).toBe(false);
    expect(isInPalace(at(5, 9), 'CHO')).toBe(true);
    expect(isInPalace(at(3, 2), 'HAN')).toBe(false);
    expect(isInPalace(at(5, 4), 'HAN')).toBe(false);
  });

  it('대각선 위 지점은 네 귀퉁이와 중앙뿐이다', () => {
    for (const pos of [at(4, 1), at(6, 1), at(5, 2), at(4, 3), at(6, 3)]) {
      expect(isOnPalaceDiagonal(pos)).toBe(true);
    }
    for (const pos of [at(5, 1), at(4, 2), at(6, 2), at(5, 3)]) {
      expect(isOnPalaceDiagonal(pos)).toBe(false);
    }
    expect(isOnPalaceDiagonal(at(5, 9))).toBe(true);
    expect(isOnPalaceDiagonal(at(5, 8))).toBe(false);
  });
});

describe('전진 방향', () => {
  it('한은 rank 증가, 초는 rank 감소가 전진이다', () => {
    expect(forwardDir('HAN')).toBe(1);
    expect(forwardDir('CHO')).toBe(-1);
  });
});

describe('초기 배치', () => {
  const board = createInitialBoard('MSMS', 'MSMS');

  it('한은 위, 초는 아래에 놓인다', () => {
    expect(pieceAt(board, at(1, 1))).toEqual({ side: 'HAN', type: 'CHA' });
    expect(pieceAt(board, at(9, 1))).toEqual({ side: 'HAN', type: 'CHA' });
    expect(pieceAt(board, at(4, 1))).toEqual({ side: 'HAN', type: 'SA' });
    expect(pieceAt(board, at(5, 1))).toBeNull();
    expect(pieceAt(board, at(5, 2))).toEqual({ side: 'HAN', type: 'GUNG' });
    expect(pieceAt(board, at(2, 3))).toEqual({ side: 'HAN', type: 'PO' });
    expect(pieceAt(board, at(8, 3))).toEqual({ side: 'HAN', type: 'PO' });
    for (const file of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, { file, rank: 4 })).toEqual({ side: 'HAN', type: 'JOL' });
    }

    expect(pieceAt(board, at(1, 10))).toEqual({ side: 'CHO', type: 'CHA' });
    expect(pieceAt(board, at(5, 9))).toEqual({ side: 'CHO', type: 'GUNG' });
    expect(pieceAt(board, at(2, 8))).toEqual({ side: 'CHO', type: 'PO' });
    for (const file of [1, 3, 5, 7, 9]) {
      expect(pieceAt(board, { file, rank: 7 })).toEqual({ side: 'CHO', type: 'JOL' });
    }
  });

  it('기물 수는 각 진영 16개다', () => {
    const count = (side: 'HAN' | 'CHO') => board.filter((p) => p?.side === side).length;
    expect(count('HAN')).toBe(16);
    expect(count('CHO')).toBe(16);
  });

  it('마상 배치 코드는 file 2, 3, 7, 8 순서로 적용된다', () => {
    const b = createInitialBoard('SMMS', 'MSSM');
    expect(pieceAt(b, at(2, 1))?.type).toBe('SANG');
    expect(pieceAt(b, at(3, 1))?.type).toBe('MA');
    expect(pieceAt(b, at(7, 1))?.type).toBe('MA');
    expect(pieceAt(b, at(8, 1))?.type).toBe('SANG');

    expect(pieceAt(b, at(2, 10))?.type).toBe('MA');
    expect(pieceAt(b, at(3, 10))?.type).toBe('SANG');
    expect(pieceAt(b, at(7, 10))?.type).toBe('SANG');
    expect(pieceAt(b, at(8, 10))?.type).toBe('MA');
  });

  it('텍스트 보드는 10행으로 출력된다', () => {
    const lines = renderBoard(board).split('\n');
    expect(lines).toHaveLength(12); // 머리글 + 10행 + 범례
    expect(lines[1]).toContain('R');
  });
});
