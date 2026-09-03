// 장기판 SVG 렌더링 + 입력 처리. 규칙 판단은 하지 않으며 props로 받은 데이터만 그린다.
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { FILES, pieceAt, pieceLabel, RANKS, SIDE_NAME_KO, samePosition } from '../engine'
import type { Board as BoardState, Move, PieceScript, Position } from '../engine'
import './Board.css'
import { PieceGlyph } from './PieceGlyph'

const CELL = 62
const MARGIN = 46
const BOARD_W = MARGIN * 2 + CELL * (FILES - 1)
const BOARD_H = MARGIN * 2 + CELL * (RANKS - 1)

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function toXY(pos: Position, flipped: boolean): { x: number; y: number } {
  const file = flipped ? FILES + 1 - pos.file : pos.file
  const rank = flipped ? RANKS + 1 - pos.rank : pos.rank
  return { x: MARGIN + (file - 1) * CELL, y: MARGIN + (rank - 1) * CELL }
}

function nearestPoint(x: number, y: number, flipped: boolean): Position {
  const file = clamp(Math.round((x - MARGIN) / CELL) + 1, 1, FILES)
  const rank = clamp(Math.round((y - MARGIN) / CELL) + 1, 1, RANKS)
  return {
    file: flipped ? FILES + 1 - file : file,
    rank: flipped ? RANKS + 1 - rank : rank,
  }
}

const ARROW_DELTA: Record<string, readonly [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
}

export interface BoardProps {
  readonly board: BoardState
  readonly selected: Position | null
  readonly legalTargets: readonly Position[]
  readonly lastMove: Move | null
  readonly checkedGungPos: Position | null
  readonly showHanja: boolean
  readonly flipped: boolean
  readonly interactive: boolean
  readonly onPointClick: (pos: Position) => void
}

export function Board({ board, selected, legalTargets, lastMove, checkedGungPos, showHanja, flipped, interactive, onPointClick }: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<{ from: Position; x: number; y: number } | null>(null)
  const [focused, setFocused] = useState<Position>({ file: 5, rank: 5 })
  const [hasFocus, setHasFocus] = useState(false)
  const script: PieceScript = showHanja ? 'HANJA' : 'HANGUL'

  const prefersReducedMotion = usePrefersReducedMotion()

  function clientToSvgPoint(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const local = point.matrixTransform(ctm.inverse())
    return { x: local.x, y: local.y }
  }

  function handlePointerDown(pos: Position, e: ReactPointerEvent<SVGGElement>) {
    if (!interactive) return
    onPointClick(pos)
    const { x, y } = clientToSvgPoint(e.clientX, e.clientY)
    setDrag({ from: pos, x, y })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!drag) return
    const { x, y } = clientToSvgPoint(e.clientX, e.clientY)
    setDrag((prev) => (prev ? { ...prev, x, y } : prev))
  }

  function handlePointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    if (!drag) return
    const { x, y } = clientToSvgPoint(e.clientX, e.clientY)
    const target = nearestPoint(x, y, flipped)
    setDrag(null)
    if (!samePosition(target, drag.from)) onPointClick(target)
  }

  function handleKeyDown(e: ReactKeyboardEvent<SVGSVGElement>) {
    if (!interactive) return
    const delta = ARROW_DELTA[e.key]
    if (delta) {
      e.preventDefault()
      const [dx, dy] = flipped ? [-delta[0], -delta[1]] : delta
      setFocused((prev) => ({ file: clamp(prev.file + dx, 1, FILES), rank: clamp(prev.rank + dy, 1, RANKS) }))
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPointClick(focused)
    }
  }

  const points: Position[] = []
  for (let rank = 1; rank <= RANKS; rank++) {
    for (let file = 1; file <= FILES; file++) points.push({ file, rank })
  }

  const palaces: Array<{ top: number; bottom: number }> = [
    { top: 1, bottom: 3 },
    { top: 8, bottom: 10 },
  ]

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
      className="janggi-board"
      role="group"
      aria-label="장기판"
      tabIndex={interactive ? 0 : -1}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
    >
      <rect x={0} y={0} width={BOARD_W} height={BOARD_H} className="janggi-board__background" />

      {/* 격자선 */}
      {Array.from({ length: RANKS }, (_, i) => i + 1).map((rank) => {
        const a = toXY({ file: 1, rank }, flipped)
        const b = toXY({ file: FILES, rank }, flipped)
        return <line key={`h${rank}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="janggi-board__line" />
      })}
      {Array.from({ length: FILES }, (_, i) => i + 1).map((file) => {
        const a = toXY({ file, rank: 1 }, flipped)
        const b = toXY({ file, rank: RANKS }, flipped)
        return <line key={`v${file}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="janggi-board__line" />
      })}

      {/* 궁성 대각선(X자) */}
      {palaces.map(({ top, bottom }) => {
        const a = toXY({ file: 4, rank: top }, flipped)
        const b = toXY({ file: 6, rank: bottom }, flipped)
        const c = toXY({ file: 6, rank: top }, flipped)
        const d = toXY({ file: 4, rank: bottom }, flipped)
        return (
          <g key={`palace${top}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="janggi-board__line" />
            <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} className="janggi-board__line" />
          </g>
        )
      })}

      {/* 마지막 수 강조 */}
      {lastMove &&
        !lastMove.isPass &&
        [lastMove.from, lastMove.to].map((p, i) => {
          const { x, y } = toXY(p, flipped)
          return <rect key={i} x={x - 20} y={y - 20} width={40} height={40} className="janggi-board__last-move" />
        })}

      {/* 장군 강조 */}
      {checkedGungPos &&
        (() => {
          const { x, y } = toXY(checkedGungPos, flipped)
          return <circle cx={x} cy={y} r={34} className="janggi-board__check-ring" />
        })()}

      {/* 선택 강조 */}
      {selected &&
        (() => {
          const { x, y } = toXY(selected, flipped)
          return <circle cx={x} cy={y} r={30} className="janggi-board__selected-ring" />
        })()}

      {/* 이동 가능 지점 */}
      {legalTargets.map((p) => {
        const { x, y } = toXY(p, flipped)
        const occupied = pieceAt(board, p) !== null
        return <circle key={`t${p.file}-${p.rank}`} cx={x} cy={y} r={occupied ? 27 : 9} className={occupied ? 'janggi-board__capture-hint' : 'janggi-board__move-hint'} />
      })}

      {/* 키보드 포커스 표시 */}
      {hasFocus &&
        (() => {
          const { x, y } = toXY(focused, flipped)
          return <rect x={x - 24} y={y - 24} width={48} height={48} className="janggi-board__focus-ring" />
        })()}

      {/* 교차점 히트 영역 + 기물 */}
      {points.map((p) => {
        const { x, y } = toXY(p, flipped)
        const piece = pieceAt(board, p)
        const label = piece ? `${SIDE_NAME_KO[piece.side]} ${pieceLabel(piece, 'HANGUL')}, ${p.rank}행 ${p.file}열` : `${p.rank}행 ${p.file}열, 빈 칸`
        return (
          <g
            key={`${p.file}-${p.rank}`}
            transform={`translate(${x},${y})`}
            onPointerDown={(e) => handlePointerDown(p, e)}
            role="button"
            aria-label={label}
          >
            <circle r={CELL / 2 - 2} className="janggi-board__hit" />
            {piece && (
              <AnimatedPiece
                posKey={`${p.file}-${p.rank}`}
                justArrived={!prefersReducedMotion && !!lastMove && !lastMove.isPass && samePosition(lastMove.to, p)}
                fromDelta={lastMove && !lastMove.isPass ? subtractXY(toXY(lastMove.from, flipped), { x, y }) : null}
              >
                <PieceGlyph piece={piece} script={script} radius={CELL / 2 - 6} />
              </AnimatedPiece>
            )}
          </g>
        )
      })}

      {/* 드래그 중인 유령 기물 */}
      {drag &&
        (() => {
          const piece = pieceAt(board, drag.from)
          if (!piece) return null
          return (
            <g transform={`translate(${drag.x},${drag.y})`} className="janggi-board__ghost">
              <PieceGlyph piece={piece} script={script} radius={CELL / 2 - 6} />
            </g>
          )
        })()}
    </svg>
  )
}

function subtractXY(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: a.x - b.x, y: a.y - b.y }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return reduced
}

/** 방금 도착한 기물을 이전 위치에서 슬라이드해 들어오는 것처럼 보이게 한다(Web Animations API). */
function AnimatedPiece({ posKey, justArrived, fromDelta, children }: { posKey: string; justArrived: boolean; fromDelta: { x: number; y: number } | null; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null)

  useEffect(() => {
    if (!justArrived || !fromDelta || !ref.current) return
    ref.current.animate([{ transform: `translate(${fromDelta.x}px, ${fromDelta.y}px)` }, { transform: 'translate(0, 0)' }], {
      duration: 220,
      easing: 'ease-out',
    })
    // posKey가 바뀌어도(기물이 다른 교차점으로 재사용되어도) 매번 새로 애니메이션을 건다.
  }, [justArrived, fromDelta, posKey])

  return <g ref={ref}>{children}</g>
}
