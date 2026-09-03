/** 대국 종료 다이얼로그 — 승패 사유와 최종 점수 (P8-4). */
import { useEffect, useRef } from 'react';
import { SIDE_LABEL } from '../../engine/board';
import type { GameResult } from '../../engine/result';

export interface GameOverDialogProps {
  result: GameResult;
  onNewGame: () => void;
  onReview: () => void;
  onExport: () => void;
}

export function GameOverDialog({
  result,
  onNewGame,
  onReview,
  onExport,
}: GameOverDialogProps): JSX.Element {
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const headline =
    result.winner === null ? '비김' : `${SIDE_LABEL[result.winner]} 승리`;

  return (
    <div className="backdrop" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="over-title">
        <h2 id="over-title">{headline}</h2>
        <p>{result.label}</p>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="stat-row">
            <span className="label">초(楚) 최종 점수</span>
            <span className="value">{result.scores.CHO}</span>
          </div>
          <div className="stat-row">
            <span className="label">한(漢) 최종 점수 (덤 포함)</span>
            <span className="value">{result.scores.HAN}</span>
          </div>
        </div>

        <div className="btn-row">
          <button ref={ref} className="btn btn-primary" onClick={onNewGame}>
            새 대국
          </button>
          <button className="btn" onClick={onReview}>
            기보 살펴보기
          </button>
          <button className="btn" onClick={onExport}>
            기보 저장
          </button>
        </div>
      </div>
    </div>
  );
}
