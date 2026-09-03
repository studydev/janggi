import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { pieceLabel, type PieceLabelStyle } from '../engine/janggi-notation'
import type { Board as BoardState, LegalMove, Move, Position, Side } from '../engine/types'

const MARGIN = 40
const CELL = 80
const VIEW_WIDTH = 720
const VIEW_HEIGHT = 800

interface BoardProps {
  readonly board: BoardState
  readonly selected: Position | null
  readonly legalMoves: readonly LegalMove[]
  readonly lastMove: Move | null
  readonly checkedSide: Side | null
  readonly flipped: boolean
  readonly labelStyle: PieceLabelStyle
  readonly disabled?: boolean
  readonly onPointClick: (position: Position) => void
  readonly onMoveRequest: (from: Position, to: Position) => void
}

function samePosition(left: Position | null, right: Position): boolean {
  return left?.file === right.file && left.rank === right.rank
}

function displayPosition(position: Position, flipped: boolean): Position {
  return flipped
    ? { file: 10 - position.file, rank: 11 - position.rank }
    : position
}

function point(position: Position, flipped: boolean): { x: number; y: number } {
  const display = displayPosition(position, flipped)
  return {
    x: MARGIN + (display.file - 1) * CELL,
    y: MARGIN + (display.rank - 1) * CELL,
  }
}

function clampPosition(position: Position): Position {
  return {
    file: Math.max(1, Math.min(9, position.file)),
    rank: Math.max(1, Math.min(10, position.rank)),
  }
}

function octagonPoints(radius: number): string {
  const inset = radius * 0.42
  return [
    [-inset, -radius],
    [inset, -radius],
    [radius, -inset],
    [radius, inset],
    [inset, radius],
    [-inset, radius],
    [-radius, inset],
    [-radius, -inset],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ')
}

export function Board({
  board,
  selected,
  legalMoves,
  lastMove,
  checkedSide,
  flipped,
  labelStyle,
  disabled = false,
  onPointClick,
  onMoveRequest,
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [keyboardCursor, setKeyboardCursor] = useState<Position>(selected ?? { file: 5, rank: 9 })
  const [dragFrom, setDragFrom] = useState<Position | null>(null)

  const positionFromPointer = (event: PointerEvent<SVGSVGElement>): Position | null => {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const svgPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const displayFile = Math.round((svgPoint.x - MARGIN) / CELL) + 1
    const displayRank = Math.round((svgPoint.y - MARGIN) / CELL) + 1
    if (displayFile < 1 || displayFile > 9 || displayRank < 1 || displayRank > 10) return null
    return flipped
      ? { file: 10 - displayFile, rank: 11 - displayRank }
      : { file: displayFile, rank: displayRank }
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled) return
    const position = positionFromPointer(event)
    if (!position) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragFrom(position)
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled || !dragFrom) return
    const destination = positionFromPointer(event)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragFrom(null)
    if (!destination) return
    if (samePosition(dragFrom, destination)) onPointClick(destination)
    else onMoveRequest(dragFrom, destination)
  }

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (disabled) return
    const direction = flipped ? -1 : 1
    let next = keyboardCursor
    if (event.key === 'ArrowLeft') next = { ...next, file: next.file - direction }
    else if (event.key === 'ArrowRight') next = { ...next, file: next.file + direction }
    else if (event.key === 'ArrowUp') next = { ...next, rank: next.rank - direction }
    else if (event.key === 'ArrowDown') next = { ...next, rank: next.rank + direction }
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPointClick(keyboardCursor)
      return
    } else return

    event.preventDefault()
    setKeyboardCursor(clampPosition(next))
  }

  const palaceLines = [
    [{ file: 4, rank: 1 }, { file: 6, rank: 3 }],
    [{ file: 6, rank: 1 }, { file: 4, rank: 3 }],
    [{ file: 4, rank: 8 }, { file: 6, rank: 10 }],
    [{ file: 6, rank: 8 }, { file: 4, rank: 10 }],
  ] as const

  return (
    <svg
      ref={svgRef}
      className={`janggi-board${disabled ? ' janggi-board--disabled' : ''}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="application"
      aria-label="장기판"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDragFrom(null)}
    >
      <rect className="board-surface" x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} rx="8" />
      <g className="board-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <line
            key={`file-${index}`}
            x1={MARGIN + index * CELL}
            y1={MARGIN}
            x2={MARGIN + index * CELL}
            y2={MARGIN + 9 * CELL}
          />
        ))}
        {Array.from({ length: 10 }, (_, index) => (
          <line
            key={`rank-${index}`}
            x1={MARGIN}
            y1={MARGIN + index * CELL}
            x2={MARGIN + 8 * CELL}
            y2={MARGIN + index * CELL}
          />
        ))}
        {palaceLines.map(([from, to], index) => {
          const start = point(from, flipped)
          const end = point(to, flipped)
          return <line key={`palace-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
        })}
      </g>

      <g aria-hidden="true">
        {[lastMove?.from, lastMove?.to].map((position, index) => {
          if (!position) return null
          const location = point(position, flipped)
          return <circle key={`last-${index}`} className="last-move" cx={location.x} cy={location.y} r="34" />
        })}
        {selected && (() => {
          const location = point(selected, flipped)
          return <circle className="selected-point" cx={location.x} cy={location.y} r="35" />
        })()}
        {legalMoves.map((move) => {
          const location = point(move.to, flipped)
          return move.captured ? (
            <circle key={`${move.to.file}-${move.to.rank}`} className="capture-target" cx={location.x} cy={location.y} r="34" />
          ) : (
            <circle key={`${move.to.file}-${move.to.rank}`} className="move-target" cx={location.x} cy={location.y} r="9" />
          )
        })}
      </g>

      <g className="pieces">
        {board.map((piece, index) => {
          if (!piece) return null
          const position = { file: (index % 9) + 1, rank: Math.floor(index / 9) + 1 }
          const location = point(position, flipped)
          const isChecked = piece.type === 'GUNG' && piece.side === checkedSide
          const sideName = piece.side === 'CHO' ? '초' : '한'
          const accessiblePieceName = piece.type === 'GUNG'
            ? '궁'
            : pieceLabel(piece.side, piece.type, 'HANGUL')
          return (
            <g
              key={piece.id}
              className={`piece piece--${piece.side.toLowerCase()}${isChecked ? ' piece--checked' : ''}`}
              style={{ transform: `translate(${location.x}px, ${location.y}px)` }}
              role="img"
              aria-label={`${sideName} ${accessiblePieceName}, ${position.rank}행 ${position.file}열`}
            >
              {piece.side === 'HAN' ? <circle className="piece-shell" r="30" /> : <polygon className="piece-shell" points={octagonPoints(31)} />}
              <text className="piece-glyph" textAnchor="middle" dominantBaseline="central">
                {pieceLabel(piece.side, piece.type, labelStyle)}
              </text>
            </g>
          )
        })}
      </g>

      {!disabled && (() => {
        const location = point(keyboardCursor, flipped)
        return <circle className="keyboard-cursor" cx={location.x} cy={location.y} r="40" aria-hidden="true" />
      })()}
    </svg>
  )
}