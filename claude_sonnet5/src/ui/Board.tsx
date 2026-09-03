/**
 * SVG 장기판. **props 로만 그린다 — 규칙을 전혀 모른다.**
 *
 * - 기물은 칸이 아니라 선의 교차점(9×10) 위에 놓인다.
 * - 궁성 두 곳에 대각선(X)을 그린다. 강(河)은 없다.
 * - viewBox 기반 반응형. 보드 뒤집기 지원.
 * - 클릭 / 드래그(터치 포함) / 키보드 커서 입력.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pieceAt } from '../engine/board'
import type { Board as EngineBoard, Position, Side } from '../engine/types'
import { pieceKoreanName } from '../game/janggi-notation'
import { palette, pieceGlyph, pieceScale, sideLabel } from './pieceLabels'

const CELL = 100
const MARGIN = 112
const W = MARGIN * 2 + 8 * CELL
const H = MARGIN * 2 + 9 * CELL
const PIECE_R = 46

export type Orientation = 'CHO_BOTTOM' | 'HAN_BOTTOM'

export interface BoardProps {
  board: EngineBoard
  orientation: Orientation
  script: 'hanja' | 'hangul'
  colorblind: boolean
  animate: boolean
  showHints: boolean
  interactive: boolean
  selected: Position | null
  legalTargets: readonly Position[]
  lastMove: { from: Position; to: Position } | null
  checkSide: Side | null
  onActivateSquare: (pos: Position) => void
  onDragMove: (from: Position, to: Position) => void
  onClearSelection: () => void
}

function samePos(a: Position | null, b: Position | null): boolean {
  return a !== null && b !== null && a.file === b.file && a.rank === b.rank
}

export function Board(props: BoardProps) {
  const {
    board,
    orientation,
    script,
    colorblind,
    animate,
    showHints,
    interactive,
    selected,
    legalTargets,
    lastMove,
    checkSide,
    onActivateSquare,
    onDragMove,
    onClearSelection,
  } = props

  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState<Position>({ file: 5, rank: orientation === 'CHO_BOTTOM' ? 9 : 2 })
  const [drag, setDrag] = useState<{ from: Position; x: number; y: number; moved: boolean } | null>(null)
  // 포인터 이벤트가 한 틱에 연달아 들어와도 최신 값을 읽도록 ref 로도 추적한다.
  const dragRef = useRef<{ from: Position; moved: boolean } | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const doAnimate = animate && !reducedMotion

  // --- 좌표 변환 (교차점 <-> 화면) -------------------------------------
  const toXY = useCallback(
    (pos: Position): { x: number; y: number } => {
      const f = orientation === 'CHO_BOTTOM' ? pos.file - 1 : 9 - pos.file
      const r = orientation === 'CHO_BOTTOM' ? pos.rank - 1 : 10 - pos.rank
      return { x: MARGIN + f * CELL, y: MARGIN + r * CELL }
    },
    [orientation],
  )

  const clientToPos = useCallback(
    (clientX: number, clientY: number): Position | null => {
      const svg = svgRef.current
      if (svg === null) return null
      const ctm = svg.getScreenCTM()
      if (ctm === null) return null
      const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
      const fSlot = Math.round((p.x - MARGIN) / CELL)
      const rSlot = Math.round((p.y - MARGIN) / CELL)
      if (fSlot < 0 || fSlot > 8 || rSlot < 0 || rSlot > 9) return null
      const file = orientation === 'CHO_BOTTOM' ? fSlot + 1 : 9 - fSlot
      const rank = orientation === 'CHO_BOTTOM' ? rSlot + 1 : 10 - rSlot
      return { file, rank }
    },
    [orientation],
  )

  // --- 포인터 (클릭 + 드래그) ---------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return
    const pos = clientToPos(e.clientX, e.clientY)
    if (pos === null) return
    setCursor(pos)
    const piece = pieceAt(board, pos)
    if (piece !== null) {
      try {
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
      } catch {
        /* 합성 이벤트 등 활성 포인터가 없으면 무시 */
      }
      const { x, y } = toXY(pos)
      dragRef.current = { from: pos, moved: false }
      setDrag({ from: pos, x, y, moved: false })
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return
    const svg = svgRef.current
    if (svg === null) return
    const ctm = svg.getScreenCTM()
    if (ctm === null) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    dragRef.current = { ...dragRef.current, moved: true }
    setDrag((d) => (d === null ? null : { ...d, x: p.x, y: p.y, moved: true }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!interactive) return
    const target = clientToPos(e.clientX, e.clientY)
    const current = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (current === null) {
      if (target !== null) onActivateSquare(target)
      return
    }
    if (current.moved && target !== null && !samePos(target, current.from)) {
      onDragMove(current.from, target)
    } else {
      onActivateSquare(current.from)
    }
  }

  // --- 키보드 커서 -------------------------------------------------
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = (df: number, dr: number) => {
      e.preventDefault()
      setCursor((c) => {
        // 화면상 방향을 논리 좌표로 변환.
        const sign = orientation === 'CHO_BOTTOM' ? 1 : -1
        const file = Math.min(9, Math.max(1, c.file + df * sign))
        const rank = Math.min(10, Math.max(1, c.rank + dr * sign))
        return { file, rank }
      })
    }
    switch (e.key) {
      case 'ArrowLeft':
        return step(-1, 0)
      case 'ArrowRight':
        return step(1, 0)
      case 'ArrowUp':
        return step(0, -1)
      case 'ArrowDown':
        return step(0, 1)
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (interactive) onActivateSquare(cursor)
        return
      case 'Escape':
        onClearSelection()
        return
    }
  }

  const legalSet = useMemo(
    () => new Set(legalTargets.map((t) => `${t.file},${t.rank}`)),
    [legalTargets],
  )

  // --- 그리기 ------------------------------------------------------
  const gridLines: React.ReactNode[] = []
  for (let f = 1; f <= 9; f += 1) {
    const a = toXY({ file: f, rank: 1 })
    const b = toXY({ file: f, rank: 10 })
    gridLines.push(<line key={`v${f}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="jb-line" />)
  }
  for (let r = 1; r <= 10; r += 1) {
    const a = toXY({ file: 1, rank: r })
    const b = toXY({ file: 9, rank: r })
    gridLines.push(<line key={`h${r}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="jb-line" />)
  }

  const palaceDiagonals = ([
    [{ file: 4, rank: 1 }, { file: 6, rank: 3 }],
    [{ file: 6, rank: 1 }, { file: 4, rank: 3 }],
    [{ file: 4, rank: 8 }, { file: 6, rank: 10 }],
    [{ file: 6, rank: 8 }, { file: 4, rank: 10 }],
  ] as const).map(([p, q], i) => {
    const a = toXY(p)
    const b = toXY(q)
    return <line key={`d${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="jb-line" />
  })

  const fileLabels: React.ReactNode[] = []
  for (let f = 1; f <= 9; f += 1) {
    const top = toXY({ file: f, rank: 1 })
    const bottom = toXY({ file: f, rank: 10 })
    fileLabels.push(
      <text key={`fl${f}`} x={top.x} y={MARGIN - 56} className="jb-coord" textAnchor="middle">
        {f}
      </text>,
      <text key={`flb${f}`} x={bottom.x} y={H - MARGIN + 74} className="jb-coord" textAnchor="middle">
        {f}
      </text>,
    )
  }
  const rankLabels: React.ReactNode[] = []
  for (let r = 1; r <= 10; r += 1) {
    const left = toXY({ file: 1, rank: r })
    const right = toXY({ file: 9, rank: r })
    rankLabels.push(
      <text key={`rl${r}`} x={MARGIN - 62} y={left.y + 8} className="jb-coord" textAnchor="middle">
        {r}
      </text>,
      <text key={`rr${r}`} x={W - MARGIN + 62} y={right.y + 8} className="jb-coord" textAnchor="middle">
        {r}
      </text>,
    )
  }

  const pieces: React.ReactNode[] = []
  for (let rank = 1; rank <= 10; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const pos = { file, rank }
      const piece = pieceAt(board, pos)
      if (piece === null) continue
      if (drag !== null && samePos(drag.from, pos) && drag.moved) continue // 드래그 중인 기물은 고스트로만.

      const { x, y } = toXY(pos)
      const pal = palette(piece.side, colorblind)
      const r = PIECE_R * pieceScale(piece.type)
      const isSel = samePos(selected, pos)
      const inCheck = checkSide === piece.side && piece.type === 'GUNG'
      pieces.push(
        <g
          key={`p${file},${rank}`}
          transform={`translate(${x} ${y})`}
          className={`jb-piece${doAnimate ? ' jb-animate' : ''}${isSel ? ' jb-selected' : ''}`}
          aria-hidden="true"
        >
          <PieceShape r={r} fill={pal.fill} ring={pal.ring} thick={inCheck} />
          {inCheck && <PieceShape r={r + 9} fill="none" ring="#e11d48" thick />}
          <text className="jb-glyph" fill={pal.text} fontSize={r * 1.15} textAnchor="middle" dominantBaseline="central">
            {pieceGlyph(piece.side, piece.type, script)}
          </text>
        </g>,
      )
    }
  }

  // 하이라이트: 마지막 수, 선택, 이동 가능 지점.
  const highlights: React.ReactNode[] = []
  if (lastMove !== null) {
    for (const [key, p] of [
      ['lf', lastMove.from],
      ['lt', lastMove.to],
    ] as const) {
      const { x, y } = toXY(p)
      highlights.push(<rect key={key} x={x - 46} y={y - 46} width={92} height={92} rx={10} className="jb-last" />)
    }
  }
  if (selected !== null) {
    const { x, y } = toXY(selected)
    highlights.push(<rect key="sel" x={x - 48} y={y - 48} width={96} height={96} rx={12} className="jb-sel-box" />)
  }

  const hints: React.ReactNode[] = []
  if (showHints) {
    for (const t of legalTargets) {
      const { x, y } = toXY(t)
      const occupied = pieceAt(board, t) !== null
      hints.push(
        occupied ? (
          <circle key={`ht${t.file},${t.rank}`} cx={x} cy={y} r={52} className="jb-hint-capture" />
        ) : (
          <circle key={`ht${t.file},${t.rank}`} cx={x} cy={y} r={16} className="jb-hint-move" />
        ),
      )
    }
  }

  const cursorXY = toXY(cursor)

  const activeSideLabel = checkSide ? `${sideLabel(checkSide)} 장군` : ''

  return (
    <div
      className="jb-root"
      tabIndex={0}
      role="application"
      aria-label={`장기판, 9열 10행 교차점.${activeSideLabel ? ' ' + activeSideLabel + '.' : ''} 방향키로 이동, Enter 로 선택.`}
      onKeyDown={onKeyDown}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="jb-svg"
        role="img"
        aria-label={describeBoardForScreenReader(board)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = null
          setDrag(null)
        }}
      >
        <rect x={0} y={0} width={W} height={H} className="jb-bg" />
        <g>{gridLines}</g>
        <g>{palaceDiagonals}</g>
        <g>{fileLabels}{rankLabels}</g>
        <g>{highlights}</g>
        <g>{hints}</g>
        <g>{pieces}</g>

        {drag !== null && drag.moved && (
          <DragGhost
            x={drag.x}
            y={drag.y}
            board={board}
            from={drag.from}
            script={script}
            colorblind={colorblind}
          />
        )}

        {/* 키보드 커서 */}
        <rect
          x={cursorXY.x - 50}
          y={cursorXY.y - 50}
          width={100}
          height={100}
          rx={12}
          className="jb-cursor"
          pointerEvents="none"
        />

        {/* 접근용 히트 영역 — 각 교차점에 aria-label. 색만으로 구분하지 않도록 텍스트 포함. */}
        <g>
          {allSquares().map((pos) => {
            const { x, y } = toXY(pos)
            const piece = pieceAt(board, pos)
            const key = `${pos.file},${pos.rank}`
            const isTarget = legalSet.has(key)
            const label =
              `${pos.file}열 ${pos.rank}행` +
              (piece ? `, ${sideLabel(piece.side)} ${pieceKoreanName(piece.type, piece.side)}` : ', 빈 자리') +
              (isTarget ? ', 이동 가능' : '') +
              (samePos(selected, pos) ? ', 선택됨' : '')
            return (
              <rect
                key={`hit${key}`}
                data-square={key}
                role="button"
                tabIndex={-1}
                aria-label={label}
                x={x - CELL / 2}
                y={y - CELL / 2}
                width={CELL}
                height={CELL}
                fill="transparent"
                style={{ cursor: interactive && (piece !== null || isTarget) ? 'pointer' : 'default' }}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

function PieceShape({ r, fill, ring, thick }: { r: number; fill: string; ring: string; thick?: boolean }) {
  // 팔각형 (전통 장기 알 모양) — 형태로도 기물임을 드러낸다.
  const pts: string[] = []
  const k = r * 0.414
  const corners: [number, number][] = [
    [-k, -r], [k, -r], [r, -k], [r, k], [k, r], [-k, r], [-r, k], [-r, -k],
  ]
  for (const [px, py] of corners) pts.push(`${px.toFixed(1)},${py.toFixed(1)}`)
  return <polygon points={pts.join(' ')} fill={fill} stroke={ring} strokeWidth={thick ? 6 : 3.5} />
}

function DragGhost({
  x,
  y,
  board,
  from,
  script,
  colorblind,
}: {
  x: number
  y: number
  board: EngineBoard
  from: Position
  script: 'hanja' | 'hangul'
  colorblind: boolean
}) {
  const piece = pieceAt(board, from)
  if (piece === null) return null
  const pal = palette(piece.side, colorblind)
  const r = PIECE_R * pieceScale(piece.type)
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.9} pointerEvents="none" className="jb-ghost">
      <PieceShape r={r} fill={pal.fill} ring={pal.ring} />
      <text className="jb-glyph" fill={pal.text} fontSize={r * 1.15} textAnchor="middle" dominantBaseline="central">
        {pieceGlyph(piece.side, piece.type, script)}
      </text>
    </g>
  )
}

function allSquares(): Position[] {
  const out: Position[] = []
  for (let rank = 1; rank <= 10; rank += 1) {
    for (let file = 1; file <= 9; file += 1) out.push({ file, rank })
  }
  return out
}

function describeBoardForScreenReader(board: EngineBoard): string {
  const parts: string[] = []
  for (let rank = 1; rank <= 10; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const piece = pieceAt(board, { file, rank })
      if (piece !== null) {
        parts.push(`${file}열 ${rank}행 ${sideLabel(piece.side)} ${pieceKoreanName(piece.type, piece.side)}`)
      }
    }
  }
  return `장기판. ${parts.join(', ')}`
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return reduced
}
