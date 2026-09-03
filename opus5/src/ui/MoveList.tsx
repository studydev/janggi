import { moveText, pieceName, SIDE_NAME } from '../engine/janggi-notation';
import type { Move } from '../engine/types';

export interface MoveListProps {
  moves: readonly Move[];
  /** 현재 보고 있는 수(리플레이). null이면 마지막 국면 */
  replayPly: number | null;
  onGoto: (ply: number) => void;
}

export function MoveList({ moves, replayPly, onGoto }: MoveListProps) {
  const current = replayPly ?? moves.length;

  return (
    <div className="movelist">
      <h2>기보</h2>
      {moves.length === 0 ? (
        <p className="movelist__empty">아직 둔 수가 없다.</p>
      ) : (
        <ol className="movelist__items">
          {moves.map((move, i) => (
            <li key={i}>
              <button
                type="button"
                className={`movelist__item${current === i + 1 ? ' movelist__item--current' : ''}`}
                onClick={() => onGoto(i + 1)}
                aria-current={current === i + 1}
              >
                <span className="movelist__no">{Math.floor(i / 2) + 1}</span>
                <span className={`movelist__side movelist__side--${move.side.toLowerCase()}`}>
                  {SIDE_NAME[move.side]}
                </span>
                <span className="movelist__text">{moveText(move)}</span>
                {move.captured && (
                  <span className="movelist__captured">
                    ×{pieceName(move.side === 'HAN' ? 'CHO' : 'HAN', move.captured)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
