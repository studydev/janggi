import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { Board as BoardState, MoveRecord, Piece, Position, Side } from '../engine/types';
import './Board.css';

export interface BoardProps {
  board: BoardState;
  selected: Position | null;
  legalTargets: readonly Position[];
  lastMove: MoveRecord | null;
  checkedSide: Side | null;
  flipped: boolean;
  koreanLabels: boolean;
  accessibleColors: boolean;
  interactive: boolean;
  onSelect: (position: Position) => void;
  onMove: (from: Position, to: Position) => void;
}

const SPACING = 60;
const LEFT = 70;
const TOP = 70;
const WIDTH = 620;
const HEIGHT = 680;
const positions: Position[] = Array.from({ length: 90 }, (_, index) => ({
  file: (index % 9) + 1,
  rank: Math.floor(index / 9) + 1,
}));
const pieceNames: Record<Piece['type'], string> = {
  GUNG: '궁', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸',
};
const samePosition = (a: Position | null | undefined, b: Position) =>
  a?.file === b.file && a.rank === b.rank;
const positionKey = (position: Position) => `${position.file}-${position.rank}`;
const pieceAt = (board: BoardState, position: Position) => board[(position.rank - 1) * 9 + position.file - 1] ?? null;

export function pieceLabel(piece: Piece, koreanLabels: boolean): string {
  if (piece.type === 'GUNG') return koreanLabels ? (piece.side === 'HAN' ? '한' : '초') : (piece.side === 'HAN' ? '漢' : '楚');
  if (piece.type === 'JOL') return koreanLabels ? (piece.side === 'HAN' ? '병' : '졸') : (piece.side === 'HAN' ? '兵' : '卒');
  return koreanLabels ? pieceNames[piece.type] : ({ SA: '士', CHA: '車', PO: '包', MA: '馬', SANG: '象' })[piece.type];
}

interface Point { x: number; y: number }
interface Gesture {
  pointerId: number;
  captureElement: SVGGElement;
  from: Position;
  start: Point;
  piece: Piece | null;
  dragging: boolean;
}
interface Drag { from: Position; piece: Piece; point: Point }

export default function Board({
  board, selected, legalTargets, lastMove, checkedSide, flipped, koreanLabels,
  accessibleColors, interactive, onSelect, onMove,
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cellsRef = useRef(new Map<string, SVGGElement>());
  const gestureRef = useRef<Gesture | null>(null);
  const suppressClickUntil = useRef(0);
  const [focusPosition, setFocusPosition] = useState<Position>({ file: 5, rank: 9 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hitSize, setHitSize] = useState(SPACING);
  const id = useId().replace(/:/g, '');
  const legalKeys = new Set(legalTargets.map(positionKey));

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const width = svg.getBoundingClientRect().width;
      if (width > 0) setHitSize(Math.max(SPACING, Math.ceil((44 * WIDTH / width) * 100) / 100));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // A load, replay step, flip, or end of game invalidates a gesture in progress.
    cancelGesture();
  }, [board, flipped, interactive]);

  useEffect(() => () => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.captureElement.hasPointerCapture(gesture.pointerId)) {
      gesture.captureElement.releasePointerCapture(gesture.pointerId);
    }
  }, []);

  function pointFor(position: Position): Point {
    return {
      x: LEFT + ((flipped ? 10 - position.file : position.file) - 1) * SPACING,
      y: TOP + ((flipped ? 11 - position.rank : position.rank) - 1) * SPACING,
    };
  }

  function pointerPoint(event: { clientX: number; clientY: number }): Point {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (matrix && svg) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(matrix.inverse());
    }
    const bounds = svg?.getBoundingClientRect();
    return {
      x: bounds?.width ? ((event.clientX - bounds.left) / bounds.width) * WIDTH : 0,
      y: bounds?.height ? ((event.clientY - bounds.top) / bounds.height) * HEIGHT : 0,
    };
  }

  function positionFor(point: Point): Position | null {
    if (point.x < LEFT - hitSize / 2 || point.x > LEFT + 8 * SPACING + hitSize / 2
      || point.y < TOP - hitSize / 2 || point.y > TOP + 9 * SPACING + hitSize / 2) return null;
    const file = Math.max(1, Math.min(9, Math.round((point.x - LEFT) / SPACING) + 1));
    const rank = Math.max(1, Math.min(10, Math.round((point.y - TOP) / SPACING) + 1));
    return { file: flipped ? 10 - file : file, rank: flipped ? 11 - rank : rank };
  }

  function focusCell(position: Position) {
    setFocusPosition(position);
    cellsRef.current.get(positionKey(position))?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<SVGGElement>, position: Position) {
    const direction = flipped ? -1 : 1;
    let next = position;
    if (event.key === 'ArrowLeft') next = { ...position, file: Math.max(1, Math.min(9, position.file - direction)) };
    else if (event.key === 'ArrowRight') next = { ...position, file: Math.max(1, Math.min(9, position.file + direction)) };
    else if (event.key === 'ArrowUp') next = { ...position, rank: Math.max(1, Math.min(10, position.rank - direction)) };
    else if (event.key === 'ArrowDown') next = { ...position, rank: Math.max(1, Math.min(10, position.rank + direction)) };
    else if (event.key === 'Home') next = { ...position, file: flipped ? 9 : 1 };
    else if (event.key === 'End') next = { ...position, file: flipped ? 1 : 9 };
    else if (event.key === 'Escape') {
      event.preventDefault();
      cancelGesture();
      if (interactive && selected) onSelect(selected);
      return;
    }
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (interactive) onSelect(position);
      return;
    } else return;
    event.preventDefault();
    focusCell(next);
  }

  function onPointerDown(event: PointerEvent<SVGGElement>) {
    if (!interactive || event.button !== 0 || !event.isPrimary || gestureRef.current) return;
    // On small screens the 44 CSS-pixel hit rectangles overlap. Always resolve
    // to the nearest intersection, independent of SVG element stacking order.
    const position = positionFor(pointerPoint(event));
    if (!position) return;
    event.preventDefault();
    focusCell(position);
    gestureRef.current = {
      pointerId: event.pointerId,
      captureElement: event.currentTarget,
      from: position,
      start: { x: event.clientX, y: event.clientY },
      piece: pieceAt(board, position),
      dragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (!interactive || !gesture || gesture.pointerId !== event.pointerId || !gesture.piece) return;
    const distance = Math.hypot(event.clientX - gesture.start.x, event.clientY - gesture.start.y);
    if (!gesture.dragging && distance < 7) return;
    gesture.dragging = true;
    setDrag({ from: gesture.from, piece: gesture.piece, point: pointerPoint(event) });
  }

  function onPointerUp(event: PointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setDrag(null);
    suppressClickUntil.current = performance.now() + 400;
    if (gesture.captureElement.hasPointerCapture(event.pointerId)) gesture.captureElement.releasePointerCapture(event.pointerId);
    if (!interactive) return;
    if (gesture.dragging) {
      const target = positionFor(pointerPoint(event));
      if (target && !samePosition(gesture.from, target)) {
        focusCell(target);
        onMove(gesture.from, target);
      }
    } else onSelect(gesture.from);
  }

  function cancelGesture(event?: PointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (event && gesture && event.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;
    setDrag(null);
    if (gesture) {
      suppressClickUntil.current = performance.now() + 400;
      if (gesture.captureElement.hasPointerCapture(gesture.pointerId)) gesture.captureElement.releasePointerCapture(gesture.pointerId);
    }
  }

  function renderPiece(piece: Piece, ghost = false) {
    const radius = piece.type === 'GUNG' ? 26 : 23;
    return (
      <g className={`janggi-piece ${piece.side === 'HAN' ? 'janggi-piece--han' : 'janggi-piece--cho'} ${piece.type === 'GUNG' ? 'janggi-piece--king' : ''} ${ghost ? 'janggi-piece--ghost' : ''}`}>
        <circle className="janggi-piece-shadow" r={radius} cy="3" />
        <circle className="janggi-piece-rim" r={radius} fill={`url(#${id}-ivory)`} />
        <circle className="janggi-piece-inner" r={radius - 4} />
        <text className="janggi-piece-label" y="1" dominantBaseline="central" textAnchor="middle">{pieceLabel(piece, koreanLabels)}</text>
      </g>
    );
  }

  const ghostTarget = drag ? positionFor(drag.point) : null;
  const className = ['janggi-board', accessibleColors && 'janggi-board--accessible', interactive && 'janggi-board--interactive', drag && 'janggi-board--dragging'].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        className="janggi-board-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="grid"
        aria-label={`장기판, 9열 10행. ${flipped ? '한이 아래쪽' : '초가 아래쪽'}. 방향키로 탐색하고 Enter 또는 스페이스로 선택합니다.`}
        aria-rowcount={10}
        aria-colcount={9}
        aria-readonly={!interactive}
      >
        <defs>
          <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ead8b7" />
            <stop offset="100%" stopColor="#dbc39c" />
          </linearGradient>
          <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f5ead5" />
            <stop offset="100%" stopColor="#ede0c7" />
          </linearGradient>
          <radialGradient id={`${id}-ivory`} cx="38%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="76%" stopColor="#f8f1e2" />
            <stop offset="100%" stopColor="#e9ddc4" />
          </radialGradient>
        </defs>
        <g aria-hidden="true" pointerEvents="none">
          <rect x="7" y="9" width="606" height="664" rx="13" fill={`url(#${id}-wood)`} stroke="#c7af86" />
          <rect x="19" y="21" width="582" height="640" rx="6" fill={`url(#${id}-paper)`} stroke="#d4bf9b" />
          <path className="janggi-board-inset" d="M29 34H591 M29 648H591" />
          <g className="janggi-board-grid">
            {Array.from({ length: 10 }, (_, i) => <line key={`rank-${i}`} x1={LEFT} y1={TOP + i * SPACING} x2={LEFT + SPACING * 8} y2={TOP + i * SPACING} />)}
            {Array.from({ length: 9 }, (_, i) => <line key={`file-${i}`} x1={LEFT + i * SPACING} y1={TOP} x2={LEFT + i * SPACING} y2={TOP + SPACING * 9} />)}
            <path d="M250 70L370 190M370 70L250 190M250 490L370 610M370 490L250 610" />
            <rect className="janggi-board-border" x={LEFT} y={TOP} width={480} height={540} />
          </g>
          <g className="janggi-board-coordinates" textAnchor="middle" dominantBaseline="central">
            {Array.from({ length: 9 }, (_, index) => <g key={index}>
              <text x={LEFT + index * SPACING} y="42">{flipped ? 9 - index : index + 1}</text>
              <text x={LEFT + index * SPACING} y="640">{flipped ? 9 - index : index + 1}</text>
            </g>)}
            {Array.from({ length: 10 }, (_, index) => <g key={index}>
              <text x="39" y={TOP + index * SPACING}>{flipped ? 10 - index : index + 1}</text>
              <text x="581" y={TOP + index * SPACING}>{flipped ? 10 - index : index + 1}</text>
            </g>)}
          </g>
          {positions.map(position => {
            const { x, y } = pointFor(position);
            const piece = pieceAt(board, position);
            const isSelected = samePosition(selected, position);
            const isLegal = legalKeys.has(positionKey(position));
            const isChecked = piece?.type === 'GUNG' && piece.side === checkedSide;
            return <g key={positionKey(position)} transform={`translate(${x} ${y})`}>
              {samePosition(lastMove?.from, position) && <circle className="janggi-last-origin" r="15" />}
              {samePosition(lastMove?.to, position) && <rect className="janggi-last-destination" x="-27" y="-27" width="54" height="54" rx="12" />}
              {isChecked && <circle className="janggi-check" r="29" />}
              {isSelected && <circle className="janggi-selection" r="29" />}
              {isLegal && (piece ? <circle className="janggi-legal-capture" r="28" /> : <circle className="janggi-legal-dot" r="7" />)}
              {samePosition(ghostTarget, position) && <rect className="janggi-drop-target" x="-28" y="-28" width="56" height="56" rx="10" />}
            </g>;
          })}
          {positions.map(position => {
            const piece = pieceAt(board, position);
            if (!piece) return null;
            const { x, y } = pointFor(position);
            return <g
              key={piece.id}
              className={`janggi-piece-position ${samePosition(drag?.from, position) ? 'janggi-piece-position--dragged' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` } as CSSProperties}
            >{renderPiece(piece)}</g>;
          })}
          {drag && <g transform={`translate(${drag.point.x} ${drag.point.y})`}>{renderPiece(drag.piece, true)}</g>}
        </g>
        {Array.from({ length: 10 }, (_, rowIndex) => {
          const rank = flipped ? 10 - rowIndex : rowIndex + 1;
          return <g role="row" key={rank} aria-rowindex={rowIndex + 1}>
            {Array.from({ length: 9 }, (_, columnIndex) => {
              const position = { file: flipped ? 9 - columnIndex : columnIndex + 1, rank };
              const key = positionKey(position);
              const { x, y } = pointFor(position);
              const piece = pieceAt(board, position);
              const isSelected = samePosition(selected, position);
              const isLegal = legalKeys.has(key);
              const description = piece
                ? `${piece.side === 'HAN' ? '한' : '초'} ${piece.type === 'JOL' && piece.side === 'HAN' ? '병' : pieceNames[piece.type]}`
                : '빈 자리';
              return <g
                key={key}
                ref={node => { if (node) cellsRef.current.set(key, node); else cellsRef.current.delete(key); }}
                className={`janggi-gridcell ${piece ? 'janggi-gridcell--piece' : ''}`}
                transform={`translate(${x} ${y})`}
                role="gridcell"
                aria-colindex={columnIndex + 1}
                aria-label={`${position.file}열 ${position.rank}행, ${description}${isLegal ? ', 이동 가능' : ''}${piece?.type === 'GUNG' && piece.side === checkedSide ? ', 장군' : ''}`}
                aria-selected={isSelected}
                tabIndex={samePosition(focusPosition, position) ? 0 : -1}
                onFocus={() => setFocusPosition(position)}
                onKeyDown={event => onKeyDown(event, position)}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={cancelGesture}
                onLostPointerCapture={cancelGesture}
                onClick={event => {
                  if (!interactive || performance.now() < suppressClickUntil.current) return;
                  const target = event.detail === 0 ? position : positionFor(pointerPoint(event));
                  if (target) { focusCell(target); onSelect(target); }
                }}
              >
                <rect className="janggi-cell-hit" x={-hitSize / 2} y={-hitSize / 2} width={hitSize} height={hitSize} />
                <rect className="janggi-cell-focus" x="-28" y="-28" width="56" height="56" rx="10" />
              </g>;
            })}
          </g>;
        })}
      </svg>
    </div>
  );
}
