import { useEffect, useRef } from 'react';
import { calculateScore, SIDE_LABEL } from '../engine/result';
import type { GameResult } from '../engine/result';
import type { GameState } from '../engine/types';

export interface ResultDialogProps {
  result: GameResult;
  game: GameState;
  onNewGame: () => void;
  onReview: () => void;
}

const STATUS_TEXT: Record<GameResult['status'], string> = {
  PLAYING: '',
  CHECKMATE: '외통',
  RESIGN: '기권',
  DRAW_AGREED: '합의 무승부',
  DRAW_BY_SCORE: '점수 판정',
};

export function ResultDialog({ result, game, onNewGame, onReview }: ResultDialogProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="modal__box">
        <h2 id="result-title">
          {result.winner ? `${SIDE_LABEL[result.winner]} 승리` : '무승부'}
        </h2>
        <p className="modal__reason">
          {STATUS_TEXT[result.status]} — {result.reason}
        </p>
        <p className="modal__score">
          최종 점수 · 한 {calculateScore(game, 'HAN')}점 : 초 {calculateScore(game, 'CHO')}점
        </p>
        <div className="modal__actions">
          <button ref={closeRef} type="button" className="btn btn--primary" onClick={onNewGame}>
            새 대국
          </button>
          <button type="button" className="btn" onClick={onReview}>
            기보 살펴보기
          </button>
        </div>
      </div>
    </div>
  );
}
