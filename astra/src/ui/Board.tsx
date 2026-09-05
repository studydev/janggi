import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { indexToPosition, positionToIndex, samePosition } from '../engine/board'
import { pieceLabel, pointLabel, SIDE_NAMES } from '../engine/janggi-notation'
import type { PieceNotation } from '../engine/janggi-notation'
import type { Board as BoardData, Move, Piece, Position } from '../engine/types'

interface BoardProps {
  board: BoardData
  selected: Position | null
  targets: ReadonlyArray<{ position: Position; capture: boolean }>
  lastMove: Move | null
  checkedKing: Position | null
  flipped: boolean
  notation: PieceNotation
  interactive: boolean
  onSelect: (position: Position) => void
  onMove: (from: Position, to: Position) => void
  onClear: () => void
}

function displayPoint(position: Position, flipped: boolean) {
  return { x: 40 + (flipped ? 9 - position.file : position.file - 1) * 60, y: 40 + (flipped ? 10 - position.rank : position.rank - 1) * 60 }
}

export function PieceGlyph({ piece, notation = 'hanja' }: { piece: Pick<Piece, 'type' | 'side'>; notation?: PieceNotation }) {
  const king = piece.type === 'GUNG'
  return (
    <g className={`piece-glyph piece--${piece.side}`}>
      <circle className="piece-shadow" cy="2" r={king ? 28 : 25} />
      <circle className="piece-face" r={king ? 28 : 25} />
      <circle className="piece-inner" r={king ? 23.5 : 20.5} strokeDasharray={piece.side === 'CHO' ? 'none' : '2 2'} />
      <text className={`piece-character ${king ? 'king-character' : ''}`} textAnchor="middle" dominantBaseline="central" y="-3">{pieceLabel(piece, notation)}</text>
      <text className="piece-side" textAnchor="middle" y={king ? 19 : 17}>{SIDE_NAMES[piece.side]}</text>
    </g>
  )
}

export function Board({ board, selected, targets, lastMove, checkedKing, flipped, notation, interactive, onSelect, onMove, onClear }: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ origin: Position; clientX: number; clientY: number; moved: boolean } | null>(null)
  const [activeIndex, setActiveIndex] = useState(58)
  const [width, setWidth] = useState(560)
  const [drag, setDrag] = useState<{ piece: Piece; x: number; y: number } | null>(null)
  const hitSize = Math.max(54, 44 * 560 / width)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || 560))
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  function pointerCoordinates(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - rect.left) * 560 / rect.width, y: (event.clientY - rect.top) * 620 / rect.height }
  }

  function pointerPosition(event: PointerEvent<SVGSVGElement>): Position | null {
    const point = pointerCoordinates(event)
    const file = Math.round((point.x - 40) / 60) + 1
    const rank = Math.round((point.y - 40) / 60) + 1
    if (file < 1 || file > 9 || rank < 1 || rank > 10) return null
    return flipped ? { file: 10 - file, rank: 11 - rank } : { file, rank }
  }

  function pointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!interactive || event.button !== 0 || !event.isPrimary) return
    const origin = pointerPosition(event)
    if (!origin) return
    gesture.current = { origin, clientX: event.clientX, clientY: event.clientY, moved: false }
    setActiveIndex(positionToIndex(origin))
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current
    if (!current || !interactive) return
    if (Math.hypot(event.clientX - current.clientX, event.clientY - current.clientY) > 5) current.moved = true
    const piece = board[positionToIndex(current.origin)]
    if (current.moved && piece) setDrag({ piece, ...pointerCoordinates(event) })
  }

  function pointerUp(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current
    const destination = pointerPosition(event)
    gesture.current = null
    setDrag(null)
    if (!interactive || !current || !destination) return
    if (current.moved) onMove(current.origin, destination)
    else onSelect(destination)
  }

  function keyDown(event: KeyboardEvent<SVGSVGElement>) {
    const position = indexToPosition(activeIndex)
    const direction = flipped ? -1 : 1
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-direction, 0], ArrowRight: [direction, 0], ArrowUp: [0, -direction], ArrowDown: [0, direction] }
    if (offsets[event.key]) {
      event.preventDefault()
      const [fileOffset, rankOffset] = offsets[event.key]
      const next = { file: Math.min(9, Math.max(1, position.file + fileOffset)), rank: Math.min(10, Math.max(1, position.rank + rankOffset)) }
      const index = positionToIndex(next)
      setActiveIndex(index)
      svgRef.current?.querySelector<SVGGElement>(`[data-point="${index}"]`)?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (interactive) onSelect(position)
    } else if (event.key === 'Escape') {
      onClear()
    }
  }

  return (
    <svg ref={svgRef} className={`janggi-board ${interactive ? 'is-interactive' : ''}`} viewBox="0 0 560 620" role="grid" aria-label="장기판" aria-disabled={!interactive}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onKeyDown={keyDown}
      onPointerCancel={() => { gesture.current = null; setDrag(null) }} onLostPointerCapture={() => { gesture.current = null; setDrag(null) }}>
      <g aria-hidden="true" className="board-surface">
        <defs><pattern id="board-grain" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.55" fill="#667364" opacity="0.085" /></pattern></defs>
        <rect className="board-fill" x="3" y="3" width="554" height="614" rx="3" />
        <rect x="3" y="3" width="554" height="614" fill="url(#board-grain)" />
        <rect className="grid-border" x="40" y="40" width="480" height="540" />
        {Array.from({ length: 9 }, (_, index) => <line className="grid-line" key={`file-${index}`} x1={40 + index * 60} y1="40" x2={40 + index * 60} y2="580" />)}
        {Array.from({ length: 10 }, (_, index) => <line className="grid-line" key={`rank-${index}`} x1="40" y1={40 + index * 60} x2="520" y2={40 + index * 60} />)}
        {[40, 460].map((top) => <path className="palace-line" key={top} d={`M220 ${top} L340 ${top + 120} M340 ${top} L220 ${top + 120}`} />)}
        {[2, 3, 6, 7].flatMap((rank) => (rank === 2 || rank === 7 ? [1, 7] : [0, 2, 4, 6, 8]).map((file) => (
          <g key={`${file}-${rank}`} transform={`translate(${40 + file * 60},${40 + rank * 60})`} className="board-mark">
            {file > 0 && <path d="M-7 -14 V-7 H-14 M-14 7 H-7 V14" />}
            {file < 8 && <path d="M7 -14 V-7 H14 M14 7 H7 V14" />}
          </g>
        )))}
        {Array.from({ length: 9 }, (_, index) => <text className="coordinate" key={`label-file-${index}`} x={40 + index * 60} y="11" textAnchor="middle">{flipped ? 9 - index : index + 1}</text>)}
        {Array.from({ length: 10 }, (_, index) => <text className="coordinate" key={`label-rank-${index}`} x="8" y={44 + index * 60} textAnchor="middle">{flipped ? 10 - index : index + 1}</text>)}
        {[lastMove?.from, lastMove?.to].map((position, index) => {
          if (!position) return null
          const point = displayPoint(position, flipped)
          return <rect key={index} className={`last-move last-move-${index}`} x={point.x - 27} y={point.y - 27} width="54" height="54" rx="3" />
        })}
      </g>
      {Array.from({ length: 10 }, (_, rankIndex) => (
        <g role="row" key={rankIndex}>
          {Array.from({ length: 9 }, (_, fileIndex) => {
            const position = { file: fileIndex + 1, rank: rankIndex + 1 }
            const index = positionToIndex(position)
            const point = displayPoint(position, flipped)
            const isSelected = !!selected && samePosition(selected, position)
            return <g key={index} role="gridcell" className="board-point" data-point={index} data-position={`${position.file},${position.rank}`}
              aria-label={pointLabel(position, board[index])} aria-selected={isSelected} tabIndex={activeIndex === index ? 0 : -1}
              onFocus={() => setActiveIndex(index)} transform={`translate(${point.x},${point.y})`}>
              <rect className="point-hit" x={-hitSize / 2} y={-hitSize / 2} width={hitSize} height={hitSize} />
              <rect className="keyboard-focus" x="-28" y="-28" width="56" height="56" rx="3" />
              {isSelected && <circle className="selection-ring" r="30" />}
            </g>
          })}
        </g>
      ))}
      <g aria-hidden="true" className="piece-layer">
        {board.map((piece, index) => {
          if (!piece) return null
          const position = indexToPosition(index)
          const point = displayPoint(position, flipped)
          return <g key={piece.id} data-piece-id={piece.id} className={`board-piece ${drag?.piece.id === piece.id ? 'drag-origin' : ''}`}
            style={{ transform: `translate(${point.x}px, ${point.y}px)` }}>
            {checkedKing && samePosition(checkedKing, position) && <circle className="check-ring" r="32" />}
            <PieceGlyph piece={piece} notation={notation} />
          </g>
        })}
        {targets.map(({ position, capture }) => {
          const point = displayPoint(position, flipped)
          return <circle key={positionToIndex(position)} className={capture ? 'capture-target' : 'move-target'} cx={point.x} cy={point.y} r={capture ? 30 : 7} />
        })}
        {drag && <g transform={`translate(${drag.x},${drag.y})`} className="drag-piece"><PieceGlyph piece={drag.piece} notation={notation} /></g>}
      </g>
    </svg>
  )
}