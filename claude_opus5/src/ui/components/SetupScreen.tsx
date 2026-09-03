/**
 * 대국 설정 화면 (P8-1).
 * 마·상 배치 4종을 양쪽이 각각 고르고, 미리보기를 보여준다.
 */
import { HORSE_SETUP_LABELS, PIECE_HANJA } from '../../engine/board';
import { HORSE_SETUPS, type GameConfig, type HorseSetup, type Side } from '../../engine/types';

export interface SetupScreenProps {
  setup: Readonly<Record<Side, HorseSetup>>;
  config: GameConfig;
  onSetup: (side: Side, setup: HorseSetup) => void;
  onConfig: (config: Partial<GameConfig>) => void;
  onStart: () => void;
  onImport: (file: File) => void;
}

const SIDE_TITLE: Record<Side, string> = { CHO: '초(楚) · 아래 · 선수', HAN: '한(漢) · 위 · 후수' };
const SIDE_COLOR: Record<Side, string> = { CHO: '#15803d', HAN: '#d92d20' };

function SetupPreview({ setup, side }: { setup: HorseSetup; side: Side }): JSX.Element {
  return (
    <span className="choice-preview" aria-hidden="true">
      {setup.split('').map((ch, i) => (
        <span key={i} style={{ color: SIDE_COLOR[side] }}>
          {ch === 'M' ? PIECE_HANJA.MA[side] : PIECE_HANJA.SANG[side]}
        </span>
      ))}
    </span>
  );
}

export function SetupScreen({
  setup,
  config,
  onSetup,
  onConfig,
  onStart,
  onImport,
}: SetupScreenProps): JSX.Element {
  return (
    <div className="setup">
      <div className="panel">
        <h2 className="panel-title">대국 방식</h2>
        <div className="field">
          <label htmlFor="mode">상대</label>
          <select id="mode" value="local" disabled>
            <option value="local">로컬 2인 대국 (한 화면에서 번갈아)</option>
          </select>
        </div>
        <p className="empty-note" style={{ margin: 0 }}>
          AI 대전과 온라인 대전은 이번 구현 범위에 포함되지 않았습니다.
        </p>
      </div>

      <div className="panel">
        <h2 className="panel-title">마·상 배치</h2>
        <p className="empty-note" style={{ marginTop: 0 }}>
          장기는 대국 시작 전에 양쪽이 각자 마(馬)와 상(象)의 자리를 고릅니다. 아래 순서는 왼쪽부터
          2열·3열·7열·8열에 놓이는 기물입니다.
        </p>
        <div className="setup-grid">
          {(['CHO', 'HAN'] as const).map((side) => (
            <fieldset key={side} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontWeight: 600,
                  marginBottom: 8,
                  color: SIDE_COLOR[side],
                }}
              >
                {SIDE_TITLE[side]}
              </legend>
              <div className="choice-list">
                {HORSE_SETUPS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="choice"
                    aria-pressed={setup[side] === option}
                    onClick={() => onSetup(side, option)}
                  >
                    <SetupPreview setup={option} side={side} />
                    <span>{HORSE_SETUP_LABELS[option]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">규칙 설정</h2>
        <div className="field">
          <label htmlFor="bikjang">빅장을 비김으로 처리</label>
          <input
            id="bikjang"
            type="checkbox"
            checked={config.bikjangEnabled}
            onChange={(e) => onConfig({ bikjangEnabled: e.target.checked })}
          />
        </div>
        <div className="field">
          <label htmlFor="rep">같은 국면 반복 비김 (회)</label>
          <input
            id="rep"
            type="number"
            min={2}
            max={10}
            value={config.repetitionLimit}
            onChange={(e) => onConfig({ repetitionLimit: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label htmlFor="maxply">최대 수 (초과 시 점수승)</label>
          <input
            id="maxply"
            type="number"
            min={50}
            max={2000}
            step={50}
            value={config.maxPlies}
            onChange={(e) => onConfig({ maxPlies: Number(e.target.value) })}
          />
        </div>
        <p className="empty-note" style={{ margin: 0 }}>
          점수는 차13 · 포7 · 마5 · 상3 · 사3 · 졸2, 한(漢)은 후수 덤 {config.hanBonus}점입니다.
        </p>
      </div>

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary" onClick={onStart}>
          대국 시작
        </button>
        <label className="btn" style={{ cursor: 'pointer' }}>
          기보 불러오기
          <input
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
