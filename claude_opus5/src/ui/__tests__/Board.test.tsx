/**
 * 보드 렌더링. 「규칙을 모른 채 props 만 그린다」는 계약을 확인한다.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialBoard } from '../../engine/board';
import type { Position } from '../../engine/types';
import { Board, type BoardProps } from '../components/Board';
import { DEFAULT_SETTINGS } from '../settings';

function render(over: Partial<BoardProps> = {}): string {
  const props: BoardProps = {
    board: createInitialBoard('MSMS', 'MSMS'),
    ply: 0,
    flipped: false,
    selected: null,
    legalTargets: [],
    lastMove: null,
    checkedGung: null,
    settings: DEFAULT_SETTINGS,
    interactive: true,
    movableSide: 'CHO',
    onSelect: () => {},
    onMove: () => {},
    ...over,
  };
  return renderToStaticMarkup(<Board {...props} />);
}

function count(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

describe('Board', () => {
  it('90개 교차점 전부에 입력 판정 영역과 aria-label 이 붙는다', () => {
    const html = render();
    expect(count(html, 'role="gridcell"')).toBe(90);
    expect(html).toContain('id="jg-hit-1-1"');
    expect(html).toContain('id="jg-hit-9-10"');
    expect(html).toContain('초(楚) 차, 10행 1열');
    expect(html).toContain('한(漢) 병, 4행 1열');
    expect(html).toContain('빈 지점, 5행 5열');
  });

  it('초기 배치의 기물 32개를 그린다', () => {
    expect(count(render(), 'class="jg-piece"')).toBe(32);
  });

  it('궁성 대각선을 양쪽 모두 그린다', () => {
    const html = render();
    // 가로 10 + 세로 9 + 궁성 대각 4 = 23개의 선
    expect(count(html, 'class="jg-line"')).toBe(23);
    // 한 궁성 대각선: (4,1)-(6,3) 과 (6,1)-(4,3)
    expect(html).toContain('x1="334" y1="34" x2="534" y2="234"');
    expect(html).toContain('x1="534" y1="34" x2="334" y2="234"');
    // 초 궁성 대각선: (4,8)-(6,10) 과 (6,8)-(4,10)
    expect(html).toContain('x1="334" y1="734" x2="534" y2="934"');
  });

  it('선택과 이동 가능 지점을 표시한다 (빈 지점은 점, 잡는 지점은 링)', () => {
    const targets: Position[] = [
      { file: 5, rank: 6 },
      { file: 5, rank: 4 }, // 한의 병이 있는 자리 = 잡는 수
    ];
    const html = render({ selected: { file: 5, rank: 7 }, legalTargets: targets });
    expect(count(html, 'jg-selected')).toBe(1);
    expect(count(html, 'jg-target-move')).toBe(1);
    expect(count(html, 'jg-target-capture')).toBe(1);
  });

  it('장군일 때만 궁을 강조한다', () => {
    expect(count(render(), 'jg-check')).toBe(0);
    expect(count(render({ checkedGung: { file: 5, rank: 2 } }), 'jg-check')).toBe(1);
  });

  it('직전 수의 출발·도착을 함께 강조한다', () => {
    const html = render({ lastMove: { from: { file: 5, rank: 7 }, to: { file: 5, rank: 6 } } });
    expect(count(html, '<rect')).toBeGreaterThanOrEqual(2);
  });

  it('보드를 뒤집으면 같은 지점이 반대편 좌표로 그려진다', () => {
    const normal = render();
    const flipped = render({ flipped: true });
    expect(normal).not.toBe(flipped);
    // 뒤집어도 지점 설명(논리 좌표)은 그대로다
    expect(flipped).toContain('초(楚) 차, 10행 1열');
  });

  it('리플레이 중에는 키보드 포커스를 받지 않는다', () => {
    expect(render({ interactive: true })).toContain('tabindex="0"');
    expect(render({ interactive: false })).toContain('tabindex="-1"');
  });

  it('한자/한글 표기를 바꿔도 스크린 리더 문구는 한글로 유지된다', () => {
    const hanja = render({ settings: { ...DEFAULT_SETTINGS, pieceStyle: 'hanja' } });
    const hangul = render({ settings: { ...DEFAULT_SETTINGS, pieceStyle: 'hangul' } });
    expect(hanja).toContain('車');
    expect(hangul).toContain('>차<');
    expect(hanja).toContain('초(楚) 차, 10행 1열');
    expect(hangul).toContain('초(楚) 차, 10행 1열');
  });

  it('형태 구분을 켜면 한 진영만 팔각형으로 그린다', () => {
    const on = render({ settings: { ...DEFAULT_SETTINGS, distinctShapes: true } });
    const off = render({ settings: { ...DEFAULT_SETTINGS, distinctShapes: false } });
    expect(count(on, '<polygon')).toBe(16);
    expect(count(off, '<polygon')).toBe(0);
  });

  it('좌표 라벨은 SVG 밖 오버레이로 나온다 (가장자리 기물에 가리지 않도록)', () => {
    expect(count(render(), 'jg-rank-label')).toBe(10);
    expect(count(render(), 'jg-file-label')).toBe(9);
    expect(count(render({ settings: { ...DEFAULT_SETTINGS, showCoordinates: false } }), 'jg-rank-label')).toBe(0);
  });
});
