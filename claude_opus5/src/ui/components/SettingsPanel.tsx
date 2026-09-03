/** 표시 설정 (P12 접근성 옵션 포함). 규칙과 무관하다. */
import type { Settings } from '../settings';

export interface SettingsPanelProps {
  settings: Settings;
  flipped: boolean;
  onChange: (patch: Partial<Settings>) => void;
  onToggleFlip: () => void;
}

export function SettingsPanel({
  settings,
  flipped,
  onChange,
  onToggleFlip,
}: SettingsPanelProps): JSX.Element {
  return (
    <div className="panel">
      <h2 className="panel-title">표시 설정</h2>

      <div className="field">
        <label htmlFor="pieceStyle">기물 표기</label>
        <select
          id="pieceStyle"
          value={settings.pieceStyle}
          onChange={(e) => onChange({ pieceStyle: e.target.value as Settings['pieceStyle'] })}
        >
          <option value="hanja">한자 (車包馬象)</option>
          <option value="hangul">한글 (차포마상)</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="palette">색 팔레트</label>
        <select
          id="palette"
          value={settings.palette}
          onChange={(e) => onChange({ palette: e.target.value as Settings['palette'] })}
        >
          <option value="classic">기본 (빨강 / 초록)</option>
          <option value="colorblind">색맹 대응 (주황 / 파랑)</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="shapes">진영을 형태로도 구분 (한=팔각)</label>
        <input
          id="shapes"
          type="checkbox"
          checked={settings.distinctShapes}
          onChange={(e) => onChange({ distinctShapes: e.target.checked })}
        />
      </div>

      <div className="field">
        <label htmlFor="coords">좌표 표시</label>
        <input
          id="coords"
          type="checkbox"
          checked={settings.showCoordinates}
          onChange={(e) => onChange({ showCoordinates: e.target.checked })}
        />
      </div>

      <div className="field">
        <label htmlFor="anim">이동 애니메이션</label>
        <input
          id="anim"
          type="checkbox"
          checked={settings.animate}
          onChange={(e) => onChange({ animate: e.target.checked })}
        />
      </div>

      <div className="field">
        <label htmlFor="flip">보드 뒤집기 (한을 아래로)</label>
        <input id="flip" type="checkbox" checked={flipped} onChange={onToggleFlip} />
      </div>
    </div>
  );
}
