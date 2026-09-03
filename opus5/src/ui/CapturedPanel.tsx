import { pieceLabel } from '../engine/janggi-notation';
import type { LabelMode } from '../engine/janggi-notation';
import type { GameState, Side } from '../engine/types';
import { calculateScore } from '../engine/result';

export interface CapturedPanelProps {
  game: GameState;
  labelMode: LabelMode;
}

const SIDES: readonly Side[] = ['CHO', 'HAN'];
const TITLE: Record<Side, string> = { CHO: '초(楚)', HAN: '한(漢)' };

export function CapturedPanel({ game, labelMode }: CapturedPanelProps) {
  return (
    <div className="captured">
      {SIDES.map((side) => {
        const taken = game.capturedPieces[side];
        const enemy: Side = side === 'HAN' ? 'CHO' : 'HAN';
        return (
          <div key={side} className={`captured__row captured__row--${side.toLowerCase()}`}>
            <div className="captured__head">
              <span className="captured__side">{TITLE[side]}</span>
              <span className="captured__score">{calculateScore(game, side)}점</span>
            </div>
            <div className="captured__pieces">
              {taken.length === 0 ? (
                <span className="captured__none">잡은 기물 없음</span>
              ) : (
                taken.map((type, i) => (
                  <span key={i} className={`captured__piece captured__piece--${enemy.toLowerCase()}`}>
                    {pieceLabel(enemy, type, labelMode)}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
