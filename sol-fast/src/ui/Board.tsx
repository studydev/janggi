import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { getPiece, indexToPosition } from '../engine/board'
import { getPieceName } from '../engine/janggi-notation'
import type {
  Board as BoardState,
  LegalMove,
  MoveRecord,
  Piece,
  Position,
} from '../engine/types'
import type { LabelMode } from '../game/game-state'

const VIEWBOX_WIDTH = 700
const VIEWBOX_HEIGHT = 772
const ORIGIN_X = 62
const ORIGIN_Y = 62
const CELL_SIZE = 72

const HANJA_LABELS = {
  HAN: { GUNG: '漢', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '兵' },
  CHO: { GUNG: '楚', SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象', JOL: '卒' },
} as const

const HANGUL_LABELS = {
  HAN: { GUNG: '한', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '병' },
  CHO: { GUNG: '초', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸' },
} as const

interface BoardProps {
  readonly board: BoardState
  readonly selected: Position | null
  readonly legalMoves: ReadonlyArray<LegalMove>
  readonly lastMove: MoveRecord | null
  readonly checkedGeneral: Position | null
  readonly flipped: boolean
  readonly labelMode: LabelMode
  readonly colorBlind: boolean
  readonly disabled?: boolean
  readonly onPositionActivate: (position: Position) => void
  readonly onDragMove: (from: Position, to: Position) => void
}

interface DragState {
  readonly from: Position | null
  readonly piece: Piece | null
  readonly startX: number
  readonly startY: number
  readonly x: number
  readonly y: number
}

function samePosition(left: Position | null, right: Position): boolean {
  return left?.file === right.file && left.rank === right.rank
}

function positionKey(position: Position): string {
  return `${position.file}-${position.rank}`
}

function boardPoint(position: Position, flipped: boolean): { x: number; y: number } {
  return {
    x: ORIGIN_X + (flipped ? 9 - position.file : position.file - 1) * CELL_SIZE,
    y: ORIGIN_Y + (flipped ? 10 - position.rank : position.rank - 1) * CELL_SIZE,
  }
}

function pieceLabel(piece: Piece, labelMode: LabelMode): string {
  return labelMode === 'HANJA'
    ? HANJA_LABELS[piece.side][piece.type]
    : HANGUL_LABELS[piece.side][piece.type]
}

function pieceAriaLabel(piece: Piece, position: Position): string {
  const side = piece.side === 'HAN' ? '한' : '초'
  return `${side} ${getPieceName(piece)}, ${position.rank}행 ${position.file}열`
}

function PieceGlyph({
  piece,
  position,
  labelMode,
  ghost = false,
}: {
  readonly piece: Piece
  readonly position: Position
  readonly labelMode: LabelMode
  readonly ghost?: boolean
}) {
  return (
    <g
      className={`piece piece--${piece.side.toLowerCase()}${ghost ? ' piece--ghost' : ''}`}
      role={ghost ? undefined : 'img'}
      aria-hidden={ghost || undefined}
      aria-label={ghost ? undefined : pieceAriaLabel(piece, position)}
    >
      <circle className="piece-shadow" r="29" cx="1.5" cy="2.5" />
      <circle className="piece-shape" r="28" />
      <circle className="piece-ring" r={piece.side === 'HAN' ? 23 : 21} />
      <text className="piece-side" x="0" y="-10">
        {piece.side === 'HAN' ? '한' : '초'}
      </text>
      <text className="piece-label" x="0" y="9">
        {pieceLabel(piece, labelMode)}
      </text>
    </g>
  )
}

export function Board({
  board,
  selected,
  legalMoves,
  lastMove,
  checkedGeneral,
  flipped,
  labelMode,
  colorBlind,
  disabled = false,
  onPositionActivate,
  onDragMove,
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [focused, setFocused] = useState<Position>({ file: 5, rank: 9 })
  const [drag, setDrag] = useState<DragState | null>(null)

  function eventPoint(event: PointerEvent<SVGSVGElement>): { x: number; y: number } | null {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    return point.matrixTransform(matrix.inverse())
  }

  function positionAt(point: { x: number; y: number }): Position | null {
    const visualFile = Math.round((point.x - ORIGIN_X) / CELL_SIZE)
    const visualRank = Math.round((point.y - ORIGIN_Y) / CELL_SIZE)
    if (visualFile < 0 || visualFile > 8 || visualRank < 0 || visualRank > 9) return null

    const file = flipped ? 9 - visualFile : visualFile + 1
    const rank = flipped ? 10 - visualRank : visualRank + 1
    return { file, rank } as Position
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>): void {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    const point = eventPoint(event)
    const position = point ? positionAt(point) : null
    if (!point || !position) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setFocused(position)
    setDrag({
      from: getPiece(board, position) ? position : null,
      piece: getPiece(board, position),
      startX: point.x,
      startY: point.y,
      x: point.x,
      y: point.y,
    })
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>): void {
    if (!drag) return
    const point = eventPoint(event)
    if (!point) return
    event.preventDefault()
    setDrag({ ...drag, x: point.x, y: point.y })
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>): void {
    if (!drag) return
    const point = eventPoint(event)
    const destination = point ? positionAt(point) : null
    const distance = point
      ? Math.hypot(point.x - drag.startX, point.y - drag.startY)
      : 0

    if (destination) {
      setFocused(destination)
      if (drag.from && !samePosition(drag.from, destination) && distance > 4) {
        onDragMove(drag.from, destination)
      } else {
        onPositionActivate(destination)
      }
    }
    setDrag(null)
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>): void {
    if (disabled) return
    const fileDirection = flipped ? -1 : 1
    const rankDirection = flipped ? -1 : 1
    let file = focused.file
    let rank = focused.rank

    switch (event.key) {
      case 'ArrowLeft': file -= fileDirection; break
      case 'ArrowRight': file += fileDirection; break
      case 'ArrowUp': rank -= rankDirection; break
      case 'ArrowDown': rank += rankDirection; break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onPositionActivate(focused)
        return
      default:
        return
    }

    event.preventDefault()
    setFocused({
      file: Math.max(1, Math.min(9, file)),
      rank: Math.max(1, Math.min(10, rank)),
    } as Position)
  }

  const positions = Array.from({ length: 90 }, (_, index) => indexToPosition(index))
  const focusedPoint = boardPoint(focused, flipped)

  return (
    <svg
      ref={svgRef}
      className={`janggi-board${colorBlind ? ' janggi-board--colorblind' : ''}${disabled ? ' janggi-board--disabled' : ''}`}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      role="application"
      aria-label="장기판. 방향키로 교차점을 이동하고 Enter로 선택합니다."
      aria-activedescendant={`point-${positionKey(focused)}`}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      <rect className="board-surface" x="18" y="18" width="664" height="736" rx="6" />
      <text className="board-watermark" x="350" y="402">將棋</text>

      <g className="board-grid" aria-hidden="true">
        {Array.from({ length: 10 }, (_, rank) => (
          <line
            key={`rank-${rank}`}
            x1={ORIGIN_X}
            y1={ORIGIN_Y + rank * CELL_SIZE}
            x2={ORIGIN_X + 8 * CELL_SIZE}
            y2={ORIGIN_Y + rank * CELL_SIZE}
          />
        ))}
        {Array.from({ length: 9 }, (_, file) => (
          <line
            key={`file-${file}`}
            x1={ORIGIN_X + file * CELL_SIZE}
            y1={ORIGIN_Y}
            x2={ORIGIN_X + file * CELL_SIZE}
            y2={ORIGIN_Y + 9 * CELL_SIZE}
          />
        ))}
        <line x1="278" y1="62" x2="422" y2="206" />
        <line x1="422" y1="62" x2="278" y2="206" />
        <line x1="278" y1="566" x2="422" y2="710" />
        <line x1="422" y1="566" x2="278" y2="710" />
      </g>

      <g className="board-coordinates" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <text key={`file-label-${index}`} x={ORIGIN_X + index * CELL_SIZE} y="43">
            {flipped ? 9 - index : index + 1}
          </text>
        ))}
        {Array.from({ length: 10 }, (_, index) => (
          <text key={`rank-label-${index}`} x="38" y={ORIGIN_Y + index * CELL_SIZE + 5}>
            {flipped ? 10 - index : index + 1}
          </text>
        ))}
      </g>

      <g aria-hidden="true">
        {lastMove?.from && [lastMove.from, lastMove.to].map((position, index) => {
          if (!position) return null
          const point = boardPoint(position, flipped)
          return <circle key={`last-${index}`} className="last-move" cx={point.x} cy={point.y} r="32" />
        })}
        {checkedGeneral && (() => {
          const point = boardPoint(checkedGeneral, flipped)
          return <circle className="check-highlight" cx={point.x} cy={point.y} r="35" />
        })()}
        {selected && (() => {
          const point = boardPoint(selected, flipped)
          return <circle className="selected-highlight" cx={point.x} cy={point.y} r="34" />
        })()}
        <rect
          className="keyboard-focus"
          x={focusedPoint.x - 32}
          y={focusedPoint.y - 32}
          width="64"
          height="64"
          rx="8"
        />
        {legalMoves.map((move) => {
          const point = boardPoint(move.to, flipped)
          return move.captured
            ? <circle key={`legal-${positionKey(move.to)}`} className="capture-target" cx={point.x} cy={point.y} r="34" />
            : <circle key={`legal-${positionKey(move.to)}`} className="move-target" cx={point.x} cy={point.y} r="8" />
        })}
      </g>

      <g className="board-pieces">
        {positions.map((position) => {
          const piece = getPiece(board, position)
          if (!piece) return null
          const point = boardPoint(position, flipped)
          const isDragSource = samePosition(drag?.from ?? null, position)
          return (
            <g
              id={`point-${positionKey(position)}`}
              key={piece.id}
              className={isDragSource ? 'piece-position piece-position--dragging' : 'piece-position'}
              style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
            >
              <PieceGlyph piece={piece} position={position} labelMode={labelMode} />
            </g>
          )
        })}
      </g>

      {positions.map((position) => {
        const point = boardPoint(position, flipped)
        return (
          <circle
            id={getPiece(board, position) ? undefined : `point-${positionKey(position)}`}
            key={`hit-${positionKey(position)}`}
            className="intersection-hit"
            cx={point.x}
            cy={point.y}
            r="34"
            aria-hidden="true"
          />
        )
      })}

      {drag?.piece && (
        <g className="drag-ghost" transform={`translate(${drag.x} ${drag.y})`} aria-hidden="true">
          <PieceGlyph
            piece={drag.piece}
            position={drag.from ?? focused}
            labelMode={labelMode}
            ghost
          />
        </g>
      )}
    </svg>
  )
}