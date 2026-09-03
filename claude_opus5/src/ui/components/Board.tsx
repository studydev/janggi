/**
 * 장기판 렌더링 (SVG).
 *
 * 이 컴포넌트는 규칙을 전혀 모른다. props 로 받은 것만 그린다.
 * - 어디에 무엇이 있는가 (board)
 * - 무엇이 선택되었는가 (selected)
 * - 갈 수 있는 지점은 어디인가 (legalTargets)
 * - 직전 수 / 장군 강조 (lastMove, checkedGung)
 *
 * 「갈 수 있는가」를 여기서 판단하지 않는다. 판단은 엔진이 하고, 결과만 내려온다.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { pieceAt, PIECE_HANGUL, PIECE_HANJA } from '../../engine/board';
import { describeSquare } from '../../engine/janggi-notation';
import type { Board as BoardModel, Piece, Position, Side } from '../../engine/types';
import {
  CELL,
  FILES,
  GRID_H,
  GRID_W,
  HIT_R,
  MARGIN,
  PIECE_R,
  RANKS,
  VIEW_H,
  VIEW_W,
  clientToSvg,
  nearestPosition,
  octagonPoints,
  toXY,
  type XY,
} from '../boardGeometry';
import { PALETTES, type Settings } from '../settings';
import { usePieceIds, type MoveHint } from '../usePieceIds';

export interface BoardProps {
  board: BoardModel;
  /** 몇 번째 수인지. 기물 식별자 추적에만 쓴다. */
  ply: number;
  flipped: boolean;
  selected: Position | null;
  legalTargets: readonly Position[];
  lastMove: MoveHint | null;
  checkedGung: Position | null;
  settings: Settings;
  /** false 면 입력을 받지 않는다(리플레이 중, 대국 종료 등). */
  interactive: boolean;
  /** 집어 올릴 수 있는 진영. null 이면 아무 기물도 끌 수 없다. */
  movableSide: Side | null;
  onSelect: (pos: Position) => void;
  onMove: (from: Position, to: Position) => void;
}

const OCTAGON = octagonPoints(PIECE_R);
const FILE_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const RANK_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

interface DragState {
  readonly from: Position;
  readonly xy: XY;
  /** 「고르기」와 「끌기」를 가른다. 문턱을 넘기 전에는 클릭으로 본다. */
  readonly moved: boolean;
}

const DRAG_THRESHOLD = 12; // SVG 단위

function samePos(a: Position | null, b: Position | null): boolean {
  return a !== null && b !== null && a.file === b.file && a.rank === b.rank;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function Board({
  board,
  ply,
  flipped,
  selected,
  legalTargets,
  lastMove,
  checkedGung,
  settings,
  interactive,
  movableSide,
  onSelect,
  onMove,
}: BoardProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ids = usePieceIds(board, ply, lastMove);
  const reducedMotion = usePrefersReducedMotion();
  const animate = settings.animate && !reducedMotion;

  const [cursor, setCursor] = useState<Position>({ file: 5, rank: flipped ? 2 : 9 });
  const [focused, setFocused] = useState(false);

  /*
   * 끌기 상태는 ref 가 진실 원본이다.
   * pointerdown 과 pointerup 이 같은 렌더 배치 안에서 처리되면(빠른 탭, 터치 등)
   * state 로만 두었을 때 pointerup 이 낡은 값을 읽어 엉뚱한 지점으로 착수하게 된다.
   * 화면(끌리는 기물 잔상)에는 state 사본을 쓴다.
   */
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDragView] = useState<DragState | null>(null);

  const setDrag = useCallback((next: DragState | null): void => {
    dragRef.current = next;
    setDragView(next);
  }, []);

  const colors = PALETTES[settings.palette];
  const labels = settings.pieceStyle === 'hanja' ? PIECE_HANJA : PIECE_HANGUL;

  /* ---------------- 입력 ---------------- */

  const pointerPos = useCallback((event: PointerEvent<SVGElement>): XY | null => {
    const svg = svgRef.current;
    return svg === null ? null : clientToSvg(svg, event.clientX, event.clientY);
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<SVGElement>, at: Position): void => {
      if (!interactive) return;
      setCursor(at);
      const piece = pieceAt(board, at);
      if (piece !== null && movableSide !== null && piece.side === movableSide) {
        const xy = pointerPos(event);
        if (xy !== null) {
          // 포인터 캡처는 실패할 수 있다(이미 놓인 포인터 등).
          // 실패해도 끌기 자체는 시작하고, 놓았을 때의 좌표로 착지 지점을 정한다.
          // 여기서 예외가 새어 나가면 「눌러서 고르기」까지 함께 죽는다.
          try {
            (event.target as Element).setPointerCapture?.(event.pointerId);
          } catch {
            /* 캡처 없이 진행한다 */
          }
          setDrag({ from: at, xy, moved: false });
        }
      }
    },
    [board, interactive, movableSide, pointerPos, setDrag],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGElement>): void => {
      const current = dragRef.current;
      if (current === null) return;
      const xy = pointerPos(event);
      if (xy === null) return;
      const origin = toXY(current.from, flipped);
      const moved =
        current.moved || Math.hypot(xy.x - origin.x, xy.y - origin.y) > DRAG_THRESHOLD;
      setDrag({ from: current.from, xy, moved });
    },
    [flipped, pointerPos, setDrag],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<SVGElement>, at: Position | null): void => {
      const current = dragRef.current;
      setDrag(null);

      if (!interactive) return;

      if (current === null) {
        if (at !== null) onSelect(at);
        return;
      }

      const xy = pointerPos(event);
      const dropAt = xy === null ? at : (nearestPosition(xy, flipped) ?? at);

      if (current.moved && dropAt !== null && !samePos(dropAt, current.from)) {
        onMove(current.from, dropAt);
      } else {
        onSelect(current.from);
      }
    },
    [flipped, interactive, onMove, onSelect, pointerPos, setDrag],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<SVGSVGElement>): void => {
      const step = (df: number, dr: number): void => {
        event.preventDefault();
        setFocused(true);
        setCursor((c) => ({
          file: Math.min(FILES, Math.max(1, c.file + (flipped ? -df : df))),
          rank: Math.min(RANKS, Math.max(1, c.rank + (flipped ? -dr : dr))),
        }));
      };
      switch (event.key) {
        case 'ArrowLeft':
          step(-1, 0);
          break;
        case 'ArrowRight':
          step(1, 0);
          break;
        case 'ArrowUp':
          step(0, -1);
          break;
        case 'ArrowDown':
          step(0, 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (interactive) onSelect(cursor);
          break;
        default:
          break;
      }
    },
    [cursor, flipped, interactive, onSelect],
  );

  /* ---------------- 그리기 ---------------- */

  const gridLines: JSX.Element[] = [];
  for (let rank = 1; rank <= RANKS; rank++) {
    const y = MARGIN + (rank - 1) * CELL;
    gridLines.push(
      <line key={`h${rank}`} x1={MARGIN} y1={y} x2={MARGIN + GRID_W} y2={y} className="jg-line" />,
    );
  }
  for (let file = 1; file <= FILES; file++) {
    const x = MARGIN + (file - 1) * CELL;
    gridLines.push(
      <line key={`v${file}`} x1={x} y1={MARGIN} x2={x} y2={MARGIN + GRID_H} className="jg-line" />,
    );
  }

  // 궁성 대각선: 네 귀퉁이와 중앙을 잇는 X 자.
  const palaceDiagonals = (['HAN', 'CHO'] as const).flatMap((side) => {
    const top = side === 'HAN' ? 1 : 8;
    const a = toXY({ file: 4, rank: top }, flipped);
    const b = toXY({ file: 6, rank: top + 2 }, flipped);
    const c = toXY({ file: 6, rank: top }, flipped);
    const d = toXY({ file: 4, rank: top + 2 }, flipped);
    return [
      <line key={`${side}-1`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="jg-line" />,
      <line key={`${side}-2`} x1={c.x} y1={c.y} x2={d.x} y2={d.y} className="jg-line" />,
    ];
  });

  const pieces: { id: string; piece: Piece; at: Position }[] = [];
  for (let rank = 1; rank <= RANKS; rank++) {
    for (let file = 1; file <= FILES; file++) {
      const at = { file, rank };
      const piece = pieceAt(board, at);
      const id = ids[(rank - 1) * FILES + (file - 1)];
      if (piece !== null && id) pieces.push({ id, piece, at });
    }
  }
  // 식별자 순으로 정렬해 두면 React 가 같은 DOM 노드를 재사용해 transform 트랜지션이 걸린다.
  pieces.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const cursorId = `jg-hit-${cursor.file}-${cursor.rank}`;

  const svg = (
    <svg
      ref={svgRef}
      className={`jg-board${animate ? ' jg-animate' : ''}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="application"
      aria-label="장기판. 방향키로 지점을 옮기고 Enter 로 선택합니다."
      aria-activedescendant={cursorId}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={handleKeyDown}
      /* 커서 표시는 키보드로 들어왔을 때만. 마우스 클릭으로 포커스가 가도 링을 띄우지 않는다. */
      onFocus={(e) => setFocused(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => {
        setFocused(false);
        setDrag(null);
      }}
      onPointerMove={handlePointerMove}
    >
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} rx={10} className="jg-bg" />
      <rect
        x={MARGIN}
        y={MARGIN}
        width={GRID_W}
        height={GRID_H}
        className="jg-frame"
        fill="none"
      />
      <g className="jg-grid">{gridLines}</g>
      <g className="jg-grid">{palaceDiagonals}</g>

      {/* 직전 수 강조 */}
      {lastMove !== null && (
        <g className="jg-last" aria-hidden="true">
          {[lastMove.from, lastMove.to].map((p, i) => {
            const xy = toXY(p, flipped);
            return <rect key={i} x={xy.x - 48} y={xy.y - 48} width={96} height={96} rx={12} />;
          })}
        </g>
      )}

      {/* 장군 강조 */}
      {checkedGung !== null &&
        (() => {
          const xy = toXY(checkedGung, flipped);
          return <circle className="jg-check" cx={xy.x} cy={xy.y} r={PIECE_R + 8} aria-hidden="true" />;
        })()}

      {/* 선택 강조 */}
      {selected !== null &&
        (() => {
          const xy = toXY(selected, flipped);
          return <circle className="jg-selected" cx={xy.x} cy={xy.y} r={PIECE_R + 5} aria-hidden="true" />;
        })()}

      {/* 기물 */}
      <g className="jg-pieces">
        {pieces.map(({ id, piece, at }) => {
          const xy = toXY(at, flipped);
          const dragging = drag !== null && drag.moved && samePos(drag.from, at);
          const octagon = settings.distinctShapes && piece.side === 'HAN';
          const color = piece.side === 'HAN' ? colors.HAN : colors.CHO;
          const isGung = piece.type === 'GUNG';
          return (
            <g
              key={id}
              className={`jg-piece${dragging ? ' jg-dragging' : ''}`}
              style={{ transform: `translate(${xy.x}px, ${xy.y}px)` }}
              aria-hidden="true"
            >
              {octagon ? (
                <polygon points={OCTAGON} fill="var(--piece-face)" stroke={color} strokeWidth={isGung ? 7 : 5} />
              ) : (
                <circle r={PIECE_R} fill="var(--piece-face)" stroke={color} strokeWidth={isGung ? 7 : 5} />
              )}
              {isGung && (
                <circle r={PIECE_R - 9} fill="none" stroke={color} strokeWidth={2} opacity={0.65} />
              )}
              <text
                y={settings.pieceStyle === 'hanja' ? 17 : 16}
                textAnchor="middle"
                fill={color}
                className={`jg-glyph${isGung ? ' jg-glyph-gung' : ''}`}
              >
                {labels[piece.type][piece.side]}
              </text>
            </g>
          );
        })}
      </g>

      {/* 이동 가능 지점 */}
      <g className="jg-targets" aria-hidden="true">
        {legalTargets.map((p) => {
          const xy = toXY(p, flipped);
          const occupied = pieceAt(board, p) !== null;
          return occupied ? (
            <circle key={`t${p.file}-${p.rank}`} className="jg-target-capture" cx={xy.x} cy={xy.y} r={PIECE_R + 6} />
          ) : (
            <circle key={`t${p.file}-${p.rank}`} className="jg-target-move" cx={xy.x} cy={xy.y} r={13} />
          );
        })}
      </g>

      {/* 끌고 있는 기물 (맨 위) */}
      {drag !== null &&
        drag.moved &&
        (() => {
          const piece = pieceAt(board, drag.from);
          if (piece === null) return null;
          const octagon = settings.distinctShapes && piece.side === 'HAN';
          const color = piece.side === 'HAN' ? colors.HAN : colors.CHO;
          return (
            <g className="jg-drag-ghost" transform={`translate(${drag.xy.x} ${drag.xy.y})`} aria-hidden="true">
              {octagon ? (
                <polygon points={OCTAGON} fill="var(--piece-face)" stroke={color} strokeWidth={5} />
              ) : (
                <circle r={PIECE_R} fill="var(--piece-face)" stroke={color} strokeWidth={5} />
              )}
              <text y={17} textAnchor="middle" fill={color} className="jg-glyph">
                {labels[piece.type][piece.side]}
              </text>
            </g>
          );
        })()}

      {/* 입력 판정 레이어 — 모든 교차점을 같은 크기로 덮는다(터치 타깃 확보) */}
      <g className="jg-hits">
        {Array.from({ length: RANKS }, (_, r) =>
          Array.from({ length: FILES }, (_, f) => {
            const at = { file: f + 1, rank: r + 1 };
            const xy = toXY(at, flipped);
            const isCursor = focused && samePos(cursor, at);
            return (
              <circle
                key={`${at.file}-${at.rank}`}
                id={`jg-hit-${at.file}-${at.rank}`}
                role="gridcell"
                /* 스크린 리더에는 표기 설정과 무관하게 한글로 읽어 준다. */
                aria-label={describeSquare(pieceAt(board, at), at)}
                cx={xy.x}
                cy={xy.y}
                r={HIT_R}
                className={`jg-hit${isCursor ? ' jg-hit-cursor' : ''}`}
                onPointerDown={(e) => handlePointerDown(e, at)}
                onPointerUp={(e) => handlePointerUp(e, at)}
              />
            );
          }),
        )}
      </g>
    </svg>
  );

  // 좌표 라벨은 SVG 밖에 겹쳐 놓는다.
  // SVG 여백 안에 넣으면 가장자리 기물에 가려지고, 여백을 키우면 교차점 간격(=터치 타깃)이 줄어든다.
  // viewBox 비율이 고정이므로 백분율 위치로 정확히 정렬된다.
  return (
    <div className="jg-stage">
      <div className="jg-stage-inner">
        {svg}
        {settings.showCoordinates && (
          <div aria-hidden="true">
            {RANK_LABELS.map((_, i) => (
              <span
                key={`r${i}`}
                className="jg-rank-label"
                style={{ top: `${((MARGIN + i * CELL) / VIEW_H) * 100}%` }}
              >
                {flipped ? RANK_LABELS[RANKS - 1 - i] : RANK_LABELS[i]}
              </span>
            ))}
            {FILE_LABELS.map((_, i) => (
              <span
                key={`f${i}`}
                className="jg-file-label"
                style={{ left: `${((MARGIN + i * CELL) / VIEW_W) * 100}%` }}
              >
                {flipped ? FILE_LABELS[FILES - 1 - i] : FILE_LABELS[i]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
