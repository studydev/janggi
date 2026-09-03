/**
 * 기보 표기 (P9).
 * 표기 문자열은 janggi-notation.ts 한 곳에서만 만든다 — 그 계약을 여기서 고정한다.
 */
import { describe, expect, it } from 'vitest';
import {
  PASS_NOTATION,
  describeSquare,
  formatCoord,
  formatMove,
  formatMoveList,
  pieceLabel,
  spokenPieceName,
} from '../janggi-notation';
import type { Move } from '../types';

const move = (over: Partial<Move> = {}): Move => ({
  from: { file: 1, rank: 2 },
  to: { file: 1, rank: 4 },
  piece: 'CHA',
  side: 'CHO',
  captured: null,
  isPass: false,
  ...over,
});

describe('좌표 표기', () => {
  it('file 다음 rank, rank 10 은 0 으로 적는다', () => {
    expect(formatCoord({ file: 1, rank: 2 })).toBe('12');
    expect(formatCoord({ file: 9, rank: 1 })).toBe('91');
    expect(formatCoord({ file: 5, rank: 10 })).toBe('50');
  });
});

describe('수 표기', () => {
  it('출발좌표 + 기물명 + 도착좌표', () => {
    expect(formatMove(move())).toBe('12차14');
  });

  it('한자 표기로도 바꿀 수 있다', () => {
    expect(formatMove(move(), { pieceStyle: 'hanja' })).toBe('12車14');
  });

  it('진영에 따라 졸/병, 초/한이 갈린다', () => {
    expect(pieceLabel('JOL', 'CHO')).toBe('졸');
    expect(pieceLabel('JOL', 'HAN')).toBe('병');
    expect(pieceLabel('GUNG', 'CHO', 'hanja')).toBe('楚');
    expect(pieceLabel('GUNG', 'HAN', 'hanja')).toBe('漢');
  });

  it('한 수 쉬기는 좌표 없이 적는다', () => {
    expect(formatMove(move({ isPass: true }))).toBe(PASS_NOTATION);
  });

  it('풀어 쓴 표기에는 진영과 잡은 기물이 들어간다', () => {
    const text = formatMove(move({ captured: 'MA' }), { style: 'verbose' });
    expect(text).toContain('초(楚)');
    expect(text).toContain('12→14');
    expect(text).toContain('마 잡음');
  });

  it('기보 목록은 「번호. 초수 한수」로 묶인다', () => {
    const lines = formatMoveList([
      move(),
      move({ side: 'HAN', piece: 'MA', from: { file: 2, rank: 1 }, to: { file: 3, rank: 3 } }),
      move({ from: { file: 3, rank: 7 }, to: { file: 3, rank: 6 }, piece: 'JOL' }),
    ]);
    expect(lines).toEqual(['1. 12차14  21마33', '2. 37졸36']);
  });
});

describe('접근성 문구', () => {
  it('지점 설명은 진영·기물·행열 순서다', () => {
    expect(describeSquare({ type: 'CHA', side: 'CHO' }, { file: 1, rank: 10 })).toBe('초(楚) 차, 10행 1열');
    expect(describeSquare(null, { file: 5, rank: 5 })).toBe('빈 지점, 5행 5열');
  });
});

describe('궁의 낭독 명칭', () => {
  it('기물 면은 漢/楚 지만 읽을 때는 「궁」이라고 한다', () => {
    expect(pieceLabel('GUNG', 'HAN', 'hanja')).toBe('漢');
    expect(spokenPieceName('GUNG', 'HAN')).toBe('궁');
    expect(spokenPieceName('GUNG', 'CHO')).toBe('궁');
    expect(describeSquare({ type: 'GUNG', side: 'HAN' }, { file: 5, rank: 2 })).toBe(
      '한(漢) 궁, 2행 5열',
    );
  });

  it('졸/병은 진영에 따라 다르게 읽는다', () => {
    expect(spokenPieceName('JOL', 'CHO')).toBe('졸');
    expect(spokenPieceName('JOL', 'HAN')).toBe('병');
  });
});
