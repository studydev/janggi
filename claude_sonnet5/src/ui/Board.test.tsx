import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createInitialBoard } from '../engine/board'
import { Board } from './Board'

afterEach(cleanup)

const noop = () => {}

type BoardProps = Parameters<typeof Board>[0]
const base: BoardProps = {
  board: createInitialBoard('MSMS', 'MSMS'),
  orientation: 'CHO_BOTTOM',
  script: 'hanja',
  colorblind: false,
  animate: false,
  showHints: true,
  interactive: true,
  selected: null,
  legalTargets: [],
  lastMove: null,
  checkSide: null,
  onActivateSquare: noop,
  onDragMove: noop,
  onClearSelection: noop,
}

function squareLabel(container: HTMLElement, key: string): string {
  return container.querySelector(`[data-square="${key}"]`)?.getAttribute('aria-label') ?? ''
}

describe('<Board>', () => {
  it('교차점마다 aria-label 을 가진다 (기물/빈자리 구분)', () => {
    const { container } = render(<Board {...base} />)
    expect(container.querySelectorAll('[data-square]')).toHaveLength(90)
    expect(squareLabel(container, '1,1')).toBe('1열 1행, 한 차')
    expect(squareLabel(container, '5,9')).toBe('5열 9행, 초 궁')
    expect(squareLabel(container, '5,5')).toBe('5열 5행, 빈 자리')
  })

  it('한자 → 한글 표기 전환', () => {
    const { rerender } = render(<Board {...base} script="hanja" />)
    expect(screen.getAllByText('車').length).toBeGreaterThan(0)
    rerender(<Board {...base} script="hangul" />)
    expect(screen.getAllByText('차').length).toBeGreaterThan(0)
    expect(screen.queryByText('車')).toBeNull()
  })

  it('이동 가능 지점 / 선택 상태를 aria-label 로 노출', () => {
    const { container } = render(
      <Board {...base} selected={{ file: 2, rank: 10 }} legalTargets={[{ file: 1, rank: 8 }]} />,
    )
    expect(squareLabel(container, '2,10')).toMatch(/선택됨/)
    expect(squareLabel(container, '1,8')).toMatch(/이동 가능/)
  })

  it('보드 컨테이너는 키보드 조작 안내를 가진 application 역할', () => {
    render(<Board {...base} />)
    const app = screen.getByRole('application')
    expect(app).toHaveAttribute('tabindex', '0')
    expect(app.getAttribute('aria-label')).toMatch(/방향키/)
  })

  it('궁성 대각선 4개를 그린다 (강은 없음)', () => {
    const { container } = render(<Board {...base} />)
    // 격자 9수직 + 10수평 = 19, 궁성 대각선 4 → jb-line 23개
    expect(container.querySelectorAll('.jb-line')).toHaveLength(23)
  })
})
