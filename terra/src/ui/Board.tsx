import { memo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { pieceLabel, samePosition } from '../engine/board'
import type { Board as BoardState, Move, Piece, PieceType, Position, Side } from '../engine/types'

interface BoardProps {
  board: BoardState
  selected: Position | null
  selectedMoves: readonly Move[]
  lastMove: Move | null
  checkedSide: Side | null
  flipped: boolean
  useKoreanLabels: boolean
  interactive: boolean
  onPositionActivate: (position: Position) => void
  onMoveRequest: (from: Position, to: Position) => void
  onDeselect: () => void
}

const VIEWBOX_WIDTH = 960
const VIEWBOX_HEIGHT = 1060
const GRID_LEFT = 80
const GRID_TOP = 70
const GRID_STEP = 100
const HIT_RADIUS = 46

const koreanPieceLabels: Record<PieceType, Record<Side, string>> = {
  GUNG: { HAN: '궁', CHO: '궁' },
  SA: { HAN: '사', CHO: '사' },
  CHA: { HAN: '차', CHO: '차' },
  PO: { HAN: '포', CHO: '포' },
  MA: { HAN: '마', CHO: '마' },
  SANG: { HAN: '상', CHO: '상' },
  JOL: { HAN: '병', CHO: '졸' },
}

function visiblePieceLabel(piece: Piece, useKoreanLabels: boolean): string {
  return useKoreanLabels ? koreanPieceLabels[piece.type][piece.side] : pieceLabel(piece)
}

/** The flip transform is its own inverse, so one helper covers both directions. */
function flipPosition(position: Position, flipped: boolean): Position {
  return flipped ? { file: 10 - position.file, rank: 11 - position.rank } : position
}

function pointFor(position: Position, flipped: boolean): { x: number; y: number } {
  const visual = flipPosition(position, flipped)
  return {
    x: GRID_LEFT + (visual.file - 1) * GRID_STEP,
    y: GRID_TOP + (visual.rank - 1) * GRID_STEP,
  }
}

function positionFromPointer(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  flipped: boolean,
): Position | null {
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH
  const y = ((clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT
  const visual = {
    file: Math.round((x - GRID_LEFT) / GRID_STEP) + 1,
    rank: Math.round((y - GRID_TOP) / GRID_STEP) + 1,
  }
  if (visual.file < 1 || visual.file > 9 || visual.rank < 1 || visual.rank > 10) {
    return null
  }

  const center = pointFor(flipPosition(visual, flipped), flipped)
  if (Math.hypot(center.x - x, center.y - y) > HIT_RADIUS) {
    return null
  }
  return flipPosition(visual, flipped)
}

function lastMoveRole(move: Move | null, position: Position): 'from' | 'to' | null {
  if (move === null || move.isPass || move.from === null || move.to === null) {
    return null
  }
  if (samePosition(move.from, position)) {
    return 'from'
  }
  if (samePosition(move.to, position)) {
    return 'to'
  }
  return null
}

const ARROW_DELTAS: Record<string, Position> = {
  ArrowUp: { file: 0, rank: -1 },
  ArrowDown: { file: 0, rank: 1 },
  ArrowLeft: { file: -1, rank: 0 },
  ArrowRight: { file: 1, rank: 0 },
}

function BoardComponent({
  board,
  selected,
  selectedMoves,
  lastMove,
  checkedSide,
  flipped,
  useKoreanLabels,
  interactive,
  onPositionActivate,
  onMoveRequest,
  onDeselect,
}: BoardProps) {
  const dragOrigin = useRef<Position | null>(null)
  // The keyboard cursor tracks the last board point touched by either input
  // mode: pointer handlers below set it on press, arrow keys move it.
  const [cursor, setCursor] = useState<Position>({ file: 5, rank: 5 })

  const activate = (position: Position): void => {
    if (!interactive) {
      return
    }
    onPositionActivate(position)
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>): void => {
    if (!interactive) {
      return
    }
    const position = positionFromPointer(event.currentTarget, event.clientX, event.clientY, flipped)
    if (position === null) {
      return
    }
    dragOrigin.current = position
    setCursor(position)
    activate(position)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>): void => {
    const from = dragOrigin.current
    dragOrigin.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!interactive || from === null) {
      return
    }
    const to = positionFromPointer(event.currentTarget, event.clientX, event.clientY, flipped)
    if (to === null || samePosition(from, to)) {
      return
    }
    onMoveRequest(from, to)
  }

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>): void => {
    if (event.key === 'Escape') {
      onDeselect()
      return
    }
    const delta = ARROW_DELTAS[event.key]
    if (delta !== undefined) {
      event.preventDefault()
      setCursor((current) => ({
        file: Math.max(1, Math.min(9, current.file + (flipped ? -delta.file : delta.file))),
        rank: Math.max(1, Math.min(10, current.rank + (flipped ? -delta.rank : delta.rank))),
      }))
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(cursor)
    }
  }

  const cursorPoint = pointFor(cursor, flipped)

  return (
    <svg
      className="janggi-board"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      role="application"
      aria-label="장기판. 방향키로 위치를 옮기고 Enter로 기물을 고르거나 이동합니다. Esc로 선택을 취소합니다."
      aria-disabled={!interactive}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragOrigin.current = null
      }}
      onKeyDown={handleKeyDown}
    >
      <defs>
        <pattern id="wood-grain" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M0 12C8 4 24 20 36 9M0 30C12 21 23 35 36 25" className="grain-line" />
        </pattern>
      </defs>
      <rect className="board-surface" x="20" y="20" width="920" height="1020" rx="12" />
      <rect className="board-grain" x="20" y="20" width="920" height="1020" rx="12" />

      <g className="board-lines">
        {Array.from({ length: 10 }, (_, index) => {
          const y = GRID_TOP + index * GRID_STEP
          return <line key={`rank-${index}`} x1={GRID_LEFT} y1={y} x2={GRID_LEFT + 8 * GRID_STEP} y2={y} />
        })}
        {Array.from({ length: 9 }, (_, index) => {
          const x = GRID_LEFT + index * GRID_STEP
          return <line key={`file-${index}`} x1={x} y1={GRID_TOP} x2={x} y2={GRID_TOP + 9 * GRID_STEP} />
        })}
      </g>

      <g className="palace-lines">
        <path d="M380 70 L580 270 M580 70 L380 270" />
        <path d="M380 770 L580 970 M580 770 L380 970" />
      </g>

      <g className="coordinate-labels" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => {
          const visual = flipPosition({ file: index + 1, rank: 1 }, flipped)
          return (
            <text key={`file-label-${index}`} x={GRID_LEFT + index * GRID_STEP} y="1017">
              {visual.file}
            </text>
          )
        })}
        {Array.from({ length: 10 }, (_, index) => {
          const visual = flipPosition({ file: 1, rank: index + 1 }, flipped)
          return (
            <text key={`rank-label-${index}`} x="47" y={GRID_TOP + index * GRID_STEP + 5}>
              {visual.rank}
            </text>
          )
        })}
      </g>

      {Array.from({ length: 90 }, (_, index) => {
        const position = { file: (index % 9) + 1, rank: Math.floor(index / 9) + 1 }
        const point = pointFor(position, flipped)
        const role = lastMoveRole(lastMove, position)
        const isSelected = selected !== null && samePosition(selected, position)
        if (role === null && !isSelected) {
          return null
        }
        return (
          <g key={`markers-${index}`}>
            {role !== null && (
              <circle className={`last-move-marker last-move-${role}`} cx={point.x} cy={point.y} r="47" />
            )}
            {isSelected && <circle className="selected-marker" cx={point.x} cy={point.y} r="48" />}
          </g>
        )
      })}

      <g className="move-markers" aria-hidden="true">
        {selectedMoves.map((move) => {
          if (move.to === null) {
            return null
          }
          const point = pointFor(move.to, flipped)
          const key = `move-${move.to.file}-${move.to.rank}`
          return move.captured === null ? (
            <circle key={key} className="move-dot" cx={point.x} cy={point.y} r="12" />
          ) : (
            <circle key={key} className="capture-marker" cx={point.x} cy={point.y} r="43" />
          )
        })}
      </g>

      <circle className="keyboard-cursor" cx={cursorPoint.x} cy={cursorPoint.y} r="51" aria-hidden="true" />

      <g className="pieces">
        {board.map((piece, index) => {
          if (piece === null) {
            return null
          }
          const position = { file: (index % 9) + 1, rank: Math.floor(index / 9) + 1 }
          const point = pointFor(position, flipped)
          const isCheckedGung = piece.type === 'GUNG' && piece.side === checkedSide
          const label = visiblePieceLabel(piece, useKoreanLabels)
          const key = `${position.file},${position.rank}`

          const arrivingFrom =
            lastMove !== null && !lastMove.isPass && lastMove.to !== null && lastMove.from !== null &&
            samePosition(lastMove.to, position)
              ? pointFor(lastMove.from, flipped)
              : null
          const slideStyle: CSSProperties | undefined = arrivingFrom
            ? ({
                '--slide-x': `${arrivingFrom.x - point.x}px`,
                '--slide-y': `${arrivingFrom.y - point.y}px`,
              } as CSSProperties)
            : undefined

          return (
            <g key={`piece-${key}`} transform={`translate(${point.x} ${point.y})`}>
              <g
                className={
                  `piece piece-${piece.side.toLowerCase()}` +
                  (isCheckedGung ? ' piece-in-check' : '') +
                  (arrivingFrom ? ' piece-arriving' : '')
                }
                style={slideStyle}
                role="img"
                aria-label={`${piece.side === 'HAN' ? '한' : '초'} ${label}, ${position.rank}행 ${position.file}열`}
              >
                <circle className="piece-disc" r="39" />
                {piece.side === 'HAN' && <circle className="piece-inner-ring" r="31" />}
                <text className="piece-symbol" textAnchor="middle" dominantBaseline="central">
                  {label}
                </text>
              </g>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export const Board = memo(BoardComponent)
