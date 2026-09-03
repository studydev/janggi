import { useState, type DragEvent, type KeyboardEvent } from 'react'
import { getPiece, positionFromIndex } from '../engine'
import { pieceName } from '../engine'
import type { Board as BoardState, Move, MoveRecord, Piece, Position, Side } from '../engine'

interface BoardProps {
  readonly board: BoardState
  readonly selected: Position | null
  readonly legalMoves: ReadonlyArray<Move>
  readonly lastMove: MoveRecord | null
  readonly checkedSide: Side | null
  readonly flipped: boolean
  readonly displayKorean: boolean
  readonly interactive: boolean
  readonly onPositionClick: (position: Position) => void
}

const VIEW_WIDTH = 720
const VIEW_HEIGHT = 792
const BOARD_LEFT = 48
const BOARD_TOP = 48
const FILE_GAP = 78
const RANK_GAP = 77.333333

const palaceDiagonals = [
  [{ file: 4, rank: 1 }, { file: 5, rank: 2 }, { file: 6, rank: 3 }],
  [{ file: 6, rank: 1 }, { file: 5, rank: 2 }, { file: 4, rank: 3 }],
  [{ file: 4, rank: 8 }, { file: 5, rank: 9 }, { file: 6, rank: 10 }],
  [{ file: 6, rank: 8 }, { file: 5, rank: 9 }, { file: 4, rank: 10 }],
] as const

function visualPosition(position: Position, flipped: boolean): Position {
  return flipped ? { file: 10 - position.file, rank: 11 - position.rank } : position
}

function point(position: Position, flipped: boolean): { x: number; y: number } {
  const visual = visualPosition(position, flipped)
  return { x: BOARD_LEFT + (visual.file - 1) * FILE_GAP, y: BOARD_TOP + (visual.rank - 1) * RANK_GAP }
}

function samePosition(first: Position | null, second: Position): boolean {
  return first !== null && first.file === second.file && first.rank === second.rank
}

function squareLabel(piece: Piece | null, position: Position, displayKorean: boolean): string {
  if (piece === null) return `${position.rank}행 ${position.file}열 빈 자리`
  const sideLabel = piece.side === 'HAN' ? '한' : '초'
  return `${sideLabel} ${pieceName(piece, displayKorean)}, ${position.rank}행 ${position.file}열`
}

function linePath(path: ReadonlyArray<Position>, flipped: boolean): string {
  return path.map((position, index) => {
    const { x, y } = point(position, flipped)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
}

function moveWithDestination(moves: ReadonlyArray<Move>, position: Position): Move | undefined {
  return moves.find((move) => samePosition(move.to, position))
}

export function Board({
  board,
  selected,
  legalMoves,
  lastMove,
  checkedSide,
  flipped,
  displayKorean,
  interactive,
  onPositionClick,
}: BoardProps) {
  const [dragPosition, setDragPosition] = useState<Position | null>(null)

  const moveToPosition = (position: Position, event: KeyboardEvent<SVGGElement>) => {
    const offsets: Record<string, { file: number; rank: number }> = {
      ArrowUp: { file: 0, rank: -1 },
      ArrowDown: { file: 0, rank: 1 },
      ArrowLeft: { file: -1, rank: 0 },
      ArrowRight: { file: 1, rank: 0 },
    }
    const offset = offsets[event.key]
    if (offset === undefined) return
    const next = { file: position.file + offset.file, rank: position.rank + offset.rank }
    if (next.file < 1 || next.file > 9 || next.rank < 1 || next.rank > 10) return
    event.preventDefault()
    onPositionClick(next)
    document.querySelector<SVGGElement>(`[data-square="${next.file}-${next.rank}"]`)?.focus()
  }

  const handleDrop = (position: Position, event: DragEvent<SVGGElement>) => {
    event.preventDefault()
    if (interactive && dragPosition !== null) {
      onPositionClick(dragPosition)
      onPositionClick(position)
    }
    setDragPosition(null)
  }

  const gridLines = [
    ...Array.from({ length: 9 }, (_, index) => ({ x1: BOARD_LEFT + index * FILE_GAP, y1: BOARD_TOP, x2: BOARD_LEFT + index * FILE_GAP, y2: BOARD_TOP + 9 * RANK_GAP })),
    ...Array.from({ length: 10 }, (_, index) => ({ x1: BOARD_LEFT, y1: BOARD_TOP + index * RANK_GAP, x2: BOARD_LEFT + 8 * FILE_GAP, y2: BOARD_TOP + index * RANK_GAP })),
  ]

  return (
    <svg className="janggi-board" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="grid" aria-label="장기 보드">
      <rect className="board-surface" x="14" y="14" width="692" height="764" rx="18" />
      <g className="board-lines" aria-hidden="true">
        {gridLines.map((line, index) => <line key={index} {...line} />)}
        {palaceDiagonals.map((diagonal, index) => <path key={index} d={linePath(diagonal, flipped)} />)}
      </g>
      <g className="board-coordinates" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => {
          const position = visualPosition({ file: index + 1, rank: 10 }, flipped)
          return <text key={`file-${index}`} x={point(position, false).x} y="778">{index + 1}</text>
        })}
        {Array.from({ length: 10 }, (_, index) => {
          const position = visualPosition({ file: 1, rank: index + 1 }, flipped)
          return <text key={`rank-${index}`} x="22" y={point(position, false).y + 4}>{index + 1}</text>
        })}
      </g>
      {board.map((piece, index) => {
        const position = positionFromIndex(index)
        const { x, y } = point(position, flipped)
        const selectedPoint = samePosition(selected, position)
        const legalMove = moveWithDestination(legalMoves, position)
        const targetPiece = getPiece(board, position)
        const isLastFrom = lastMove !== null && !lastMove.isPass && samePosition(lastMove.from, position)
        const isLastTo = lastMove !== null && !lastMove.isPass && samePosition(lastMove.to, position)
        const isChecked = piece?.type === 'GUNG' && piece.side === checkedSide
        return (
          <g
            key={`${position.file}-${position.rank}`}
            className={`board-point${selectedPoint ? ' is-selected' : ''}${legalMove ? ' is-legal' : ''}${isChecked ? ' is-checked' : ''}`}
            data-square={`${position.file}-${position.rank}`}
            role="gridcell"
            tabIndex={0}
            aria-label={squareLabel(piece, position, displayKorean)}
            aria-selected={selectedPoint}
            onClick={() => interactive && onPositionClick(position)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (interactive) onPositionClick(position)
              } else {
                moveToPosition(position, event)
              }
            }}
            onDragStart={() => setDragPosition(position)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(position, event)}
            onPointerDown={() => interactive && piece !== null && setDragPosition(position)}
            onPointerUp={() => {
              if (interactive && dragPosition !== null && !samePosition(dragPosition, position)) {
                onPositionClick(dragPosition)
                onPositionClick(position)
              }
              setDragPosition(null)
            }}
          >
            {(isLastFrom || isLastTo) && <circle className={`last-marker ${isLastTo ? 'is-destination' : ''}`} cx={x} cy={y} r="27" />}
            {legalMove && <circle className={targetPiece === null ? 'legal-dot' : 'capture-dot'} cx={x} cy={y} r={targetPiece === null ? 8 : 25} />}
            <circle className="board-hit" cx={x} cy={y} r="31" />
            {piece !== null && (
              <g className={`piece piece-${piece.side.toLowerCase()}`} aria-hidden="true">
                <circle className="piece-face" cx={x} cy={y} r="25" />
                <circle className="piece-edge" cx={x} cy={y} r="21" />
                <text className="piece-glyph" x={x} y={y + 7} textAnchor="middle">{pieceName(piece, displayKorean)}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}