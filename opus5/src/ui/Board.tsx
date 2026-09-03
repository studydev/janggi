import { useCallback, useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { toPosition } from '../engine/board';
import { pieceAriaLabel, pieceLabel } from '../engine/janggi-notation';
import type { LabelMode } from '../engine/janggi-notation';
import type { Board as BoardData, Position } from '../engine/types';

const UNIT = 60;
const MARGIN = 46;
const BOTTOM_PAD = 16; // 하단 좌표 숫자 자리
const WIDTH = MARGIN * 2 + 8 * UNIT;
const HEIGHT = MARGIN * 2 + 9 * UNIT + BOTTOM_PAD;
const PIECE_RADIUS = 25;

export interface BoardProps {
  board: BoardData;
  flipped?: boolean;
  labelMode?: LabelMode;
  colorBlind?: boolean;
  selected?: Position | null;
  targets?: readonly Position[];
  lastMove?: { from: Position; to: Position } | null;
  checkAt?: Position | null;
  cursor?: Position | null;
  interactive?: boolean;
  onPress?: (pos: Position) => void;
  onRelease?: (pos: Position) => void;
}

function xOf(file: number, flipped: boolean): number {
  return MARGIN + (flipped ? 9 - file : file - 1) * UNIT;
}

function yOf(rank: number, flipped: boolean): number {
  return MARGIN + (flipped ? 10 - rank : rank - 1) * UNIT;
}

function samePos(a: Position | null | undefined, b: Position): boolean {
  return !!a && a.file === b.file && a.rank === b.rank;
}

function octagonPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI / 4) * i + Math.PI / 8;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

const PALACE_DIAGONAL_LINES: readonly [Position, Position][] = [
  [{ file: 4, rank: 1 }, { file: 6, rank: 3 }],
  [{ file: 6, rank: 1 }, { file: 4, rank: 3 }],
  [{ file: 4, rank: 8 }, { file: 6, rank: 10 }],
  [{ file: 6, rank: 8 }, { file: 4, rank: 10 }],
];

/** 규칙을 전혀 모르는 표시 전용 컴포넌트. 넘겨받은 props만 그린다. */
export function Board({
  board,
  flipped = false,
  labelMode = 'HANJA',
  colorBlind = false,
  selected = null,
  targets = [],
  lastMove = null,
  checkAt = null,
  cursor = null,
  interactive = false,
  onPress,
  onRelease,
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pressedAt = useRef<Position | null>(null);

  const locate = useCallback(
    (clientX: number, clientY: number): Position | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
      if (scale <= 0) return null;
      const x = (clientX - rect.left - (rect.width - WIDTH * scale) / 2) / scale;
      const y = (clientY - rect.top - (rect.height - HEIGHT * scale) / 2) / scale;
      const col = Math.round((x - MARGIN) / UNIT);
      const row = Math.round((y - MARGIN) / UNIT);
      if (col < 0 || col > 8 || row < 0 || row > 9) return null;
      return { file: flipped ? 9 - col : col + 1, rank: flipped ? 10 - row : row + 1 };
    },
    [flipped],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!interactive) return;
      const pos = locate(event.clientX, event.clientY);
      pressedAt.current = pos;
      if (!pos) return;
      onPress?.(pos);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // 캡처를 못 잡아도 클릭 착수는 동작한다
      }
    },
    [interactive, locate, onPress],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!interactive) return;
      const pos = locate(event.clientX, event.clientY);
      const start = pressedAt.current;
      pressedAt.current = null;
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        // 무시
      }
      if (pos && start && !samePos(start, pos)) onRelease?.(pos); // 드래그 앤 드롭
    },
    [interactive, locate, onRelease],
  );

  const paletteClass = colorBlind ? 'board board--cb' : 'board';

  return (
    <svg
      ref={svgRef}
      className={paletteClass}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="장기판"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <rect className="board__bg" x="0" y="0" width={WIDTH} height={HEIGHT} rx="8" />

      {Array.from({ length: 10 }, (_, i) => (
        <line
          key={`h${i}`}
          className="board__line"
          x1={MARGIN}
          y1={MARGIN + i * UNIT}
          x2={MARGIN + 8 * UNIT}
          y2={MARGIN + i * UNIT}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={`v${i}`}
          className="board__line"
          x1={MARGIN + i * UNIT}
          y1={MARGIN}
          x2={MARGIN + i * UNIT}
          y2={MARGIN + 9 * UNIT}
        />
      ))}
      {PALACE_DIAGONAL_LINES.map(([a, b], i) => (
        <line
          key={`d${i}`}
          className="board__line"
          x1={xOf(a.file, flipped)}
          y1={yOf(a.rank, flipped)}
          x2={xOf(b.file, flipped)}
          y2={yOf(b.rank, flipped)}
        />
      ))}

      {lastMove && (
        <g className="board__last">
          {[lastMove.from, lastMove.to].map((pos, i) => (
            <rect
              key={i}
              x={xOf(pos.file, flipped) - 26}
              y={yOf(pos.rank, flipped) - 26}
              width={52}
              height={52}
              rx={6}
            />
          ))}
        </g>
      )}

      {selected && (
        <rect
          className="board__selected"
          x={xOf(selected.file, flipped) - 28}
          y={yOf(selected.rank, flipped) - 28}
          width={56}
          height={56}
          rx={8}
        />
      )}

      {cursor && (
        <rect
          className="board__cursor"
          x={xOf(cursor.file, flipped) - 30}
          y={yOf(cursor.rank, flipped) - 30}
          width={60}
          height={60}
          rx={8}
        />
      )}

      {checkAt && (
        <circle
          className="board__check"
          cx={xOf(checkAt.file, flipped)}
          cy={yOf(checkAt.rank, flipped)}
          r={PIECE_RADIUS + 6}
        />
      )}

      {targets.map((pos) => {
        const occupied = board[(pos.rank - 1) * 9 + (pos.file - 1)] !== null;
        const cx = xOf(pos.file, flipped);
        const cy = yOf(pos.rank, flipped);
        return occupied ? (
          <circle key={`t${pos.file}${pos.rank}`} className="board__capture" cx={cx} cy={cy} r={PIECE_RADIUS + 4} />
        ) : (
          <circle key={`t${pos.file}${pos.rank}`} className="board__target" cx={cx} cy={cy} r={9} />
        );
      })}

      {board.map((piece, index) => {
        if (!piece) return null;
        const pos = toPosition(index);
        const cx = xOf(pos.file, flipped);
        const cy = yOf(pos.rank, flipped);
        const sideClass = piece.side === 'HAN' ? 'piece--han' : 'piece--cho';
        const moved = samePos(lastMove?.to, pos);
        const style = moved
          ? ({
              '--dx': `${xOf(lastMove!.from.file, flipped) - cx}px`,
              '--dy': `${yOf(lastMove!.from.rank, flipped) - cy}px`,
            } as CSSProperties)
          : undefined;

        return (
          <g key={`p${index}`} transform={`translate(${cx} ${cy})`}>
            <g
              className={`piece ${sideClass}${moved ? ' piece--moved' : ''}`}
              style={style}
              role="img"
              aria-label={pieceAriaLabel(piece.side, piece.type, pos)}
            >
              {piece.side === 'HAN' ? (
                <circle className="piece__body" cx={0} cy={0} r={PIECE_RADIUS} />
              ) : (
                <polygon className="piece__body" points={octagonPoints(0, 0, PIECE_RADIUS + 1)} />
              )}
              <text className="piece__label" x={0} y={1} textAnchor="middle" dominantBaseline="central">
                {pieceLabel(piece.side, piece.type, labelMode)}
              </text>
            </g>
          </g>
        );
      })}

      <g className="board__coords" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <text key={`cf${i}`} x={xOf(i + 1, flipped)} y={HEIGHT - 14} textAnchor="middle">
            {i + 1}
          </text>
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <text key={`cr${i}`} x={16} y={yOf(i + 1, flipped) + 5} textAnchor="middle">
            {i + 1 === 10 ? 0 : i + 1}
          </text>
        ))}
      </g>
    </svg>
  );
}
