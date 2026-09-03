// 대국 설정 화면: 양측 마상 배치 선택 + 규칙 설정 + 대국 시작.
import { useState } from 'react'
import { ALL_JIN_SETUPS, DEFAULT_CONFIG, getJinLayout, JIN_SETUP_NAME_KO } from '../engine'
import type { GameConfig, JinSetup } from '../engine'
import type { MatchSetup } from '../state/gameReducer'
import './layout.css'

export interface SetupScreenProps {
  readonly onStart: (match: MatchSetup) => void
}

function jinPreviewLabel(t: 'MA' | 'SANG'): string {
  return t === 'MA' ? '마' : '상'
}

function JinPreview({ setup }: { setup: JinSetup }) {
  const layout = getJinLayout(setup)
  return (
    <div className="jin-preview" aria-hidden="true">
      <span>{jinPreviewLabel(layout.file2)}</span>
      <span>{jinPreviewLabel(layout.file3)}</span>
      <span className="jin-preview__center">사 궁 사</span>
      <span>{jinPreviewLabel(layout.file7)}</span>
      <span>{jinPreviewLabel(layout.file8)}</span>
    </div>
  )
}

function SideSetupPicker({ label, value, onChange }: { label: string; value: JinSetup; onChange: (setup: JinSetup) => void }) {
  return (
    <fieldset className="side-setup-picker">
      <legend>{label} 마상 배치</legend>
      <div className="side-setup-picker__options">
        {ALL_JIN_SETUPS.map((setup) => (
          <label key={setup} className={`jin-option ${value === setup ? 'is-selected' : ''}`}>
            <input type="radio" name={`${label}-jin`} value={setup} checked={value === setup} onChange={() => onChange(setup)} />
            <span className="jin-option__name">{JIN_SETUP_NAME_KO[setup]}</span>
            <JinPreview setup={setup} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function clampRepetition(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_CONFIG.repetitionLimit
  return Math.min(10, Math.max(2, Math.round(value)))
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [hanSetup, setHanSetup] = useState<JinSetup>('MSMS')
  const [choSetup, setChoSetup] = useState<JinSetup>('MSMS')
  const [bikjangIsDraw, setBikjangIsDraw] = useState(DEFAULT_CONFIG.bikjangIsDraw)
  const [repetitionLimit, setRepetitionLimit] = useState(DEFAULT_CONFIG.repetitionLimit)

  function handleStart(): void {
    const config: GameConfig = { bikjangIsDraw, repetitionLimit }
    onStart({ hanSetup, choSetup, config })
  }

  return (
    <div className="setup-screen">
      <h1>장기 (Janggi)</h1>
      <p className="setup-screen__subtitle">로컬 2인 대국입니다. 양측 마상 배치를 고른 뒤 시작하세요 — 초(楚)가 먼저 둡니다.</p>

      <div className="setup-screen__pickers">
        <SideSetupPicker label="한(漢)" value={hanSetup} onChange={setHanSetup} />
        <SideSetupPicker label="초(楚)" value={choSetup} onChange={setChoSetup} />
      </div>

      <fieldset className="setup-screen__rules">
        <legend>규칙 설정</legend>
        <label className="setup-screen__rule-row">
          <input type="checkbox" checked={bikjangIsDraw} onChange={(e) => setBikjangIsDraw(e.target.checked)} />
          빅장(양 궁이 마주봄) 발생 시 점수로 승부를 가린다
        </label>
        <label className="setup-screen__rule-row">
          동일 국면 반복 허용 횟수
          <input
            type="number"
            min={2}
            max={10}
            value={repetitionLimit}
            onChange={(e) => setRepetitionLimit(clampRepetition(Number(e.target.value)))}
          />
        </label>
      </fieldset>

      <button type="button" className="setup-screen__start" onClick={handleStart}>
        대국 시작
      </button>
    </div>
  )
}
