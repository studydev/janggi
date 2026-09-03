import { useState } from 'react';
import { SETUP_CODES, SETUP_LABELS } from '../engine/types';
import type { GameConfig, SetupCode, Side } from '../engine/types';
import { createInitialBoard } from '../engine/board';
import { pieceLabel } from '../engine/janggi-notation';
import type { LabelMode } from '../engine/janggi-notation';

export interface SetupScreenProps {
  labelMode: LabelMode;
  onStart: (hanSetup: SetupCode, choSetup: SetupCode, config: Partial<GameConfig>) => void;
  resumeAvailable: boolean;
  onResume: () => void;
  onDiscardResume: () => void;
  notice: string | null;
}

/** 선택한 배치의 뒷줄만 보여주는 미리보기. */
function SetupPreview({ side, code, labelMode }: { side: Side; code: SetupCode; labelMode: LabelMode }) {
  const board = createInitialBoard(side === 'HAN' ? code : 'MSMS', side === 'CHO' ? code : 'MSMS');
  const rank = side === 'HAN' ? 1 : 10;
  const cells = Array.from({ length: 9 }, (_, i) => board[(rank - 1) * 9 + i]);

  return (
    <div className="preview" aria-hidden="true">
      {cells.map((piece, i) => (
        <span key={i} className={`preview__cell${piece ? ` preview__cell--${piece.side.toLowerCase()}` : ''}`}>
          {piece ? pieceLabel(piece.side, piece.type, labelMode) : ''}
        </span>
      ))}
    </div>
  );
}

export function SetupScreen({
  labelMode,
  onStart,
  resumeAvailable,
  onResume,
  onDiscardResume,
  notice,
}: SetupScreenProps) {
  const [hanSetup, setHanSetup] = useState<SetupCode>('MSMS');
  const [choSetup, setChoSetup] = useState<SetupCode>('MSMS');
  const [bikjangDraw, setBikjangDraw] = useState(true);
  const [repetitionLimit, setRepetitionLimit] = useState(3);

  return (
    <div className="setup">
      <header className="setup__header">
        <h1>장기</h1>
        <p>한 대국을 시작하기 전에 마·상 배치를 고른다.</p>
      </header>

      {notice && <p className="notice notice--warn">{notice}</p>}

      {resumeAvailable && (
        <div className="notice">
          <span>저장된 대국이 있다. 이어서 두겠는가?</span>
          <div className="notice__actions">
            <button type="button" className="btn btn--primary" onClick={onResume}>
              이어하기
            </button>
            <button type="button" className="btn" onClick={onDiscardResume}>
              새로 시작
            </button>
          </div>
        </div>
      )}

      <div className="setup__sides">
        {(
          [
            ['CHO', choSetup, setChoSetup, '초(楚) · 선수'],
            ['HAN', hanSetup, setHanSetup, '한(漢) · 후수 (덤 1.5점)'],
          ] as const
        ).map(([side, value, setValue, title]) => (
          <fieldset key={side} className="setup__side">
            <legend>{title}</legend>
            <div className="setup__options">
              {SETUP_CODES.map((code) => (
                <label key={code} className={`chip${value === code ? ' chip--on' : ''}`}>
                  <input
                    type="radio"
                    name={`setup-${side}`}
                    value={code}
                    checked={value === code}
                    onChange={() => setValue(code)}
                  />
                  {SETUP_LABELS[code]}
                </label>
              ))}
            </div>
            <SetupPreview side={side} code={value} labelMode={labelMode} />
          </fieldset>
        ))}
      </div>

      <fieldset className="setup__rules">
        <legend>대국 방식</legend>
        <p className="setup__mode">로컬 2인 대국 (AI 상대는 이번 버전에 없다)</p>
        <label className="check">
          <input type="checkbox" checked={bikjangDraw} onChange={(e) => setBikjangDraw(e.target.checked)} />
          빅장을 무승부로 처리
        </label>
        <label className="check">
          같은 국면 반복 제한
          <select value={repetitionLimit} onChange={(e) => setRepetitionLimit(Number(e.target.value))}>
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}회
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <button
        type="button"
        className="btn btn--primary btn--lg"
        onClick={() => onStart(hanSetup, choSetup, { bikjangDraw, repetitionLimit })}
      >
        대국 시작
      </button>
    </div>
  );
}
