import { useState } from 'react'
import { Play, ShieldCheck, Users } from 'lucide-react'
import { createInitialState, DEFAULT_CONFIG } from '../engine/board'
import type { Formation } from '../engine/types'
import { FORMATION_OPTIONS } from '../game/game-state'
import { useGame } from '../game/useGame'
import { Board } from './Board'

function FormationPicker({
  side,
  value,
  onChange,
}: {
  readonly side: 'HAN' | 'CHO'
  readonly value: Formation
  readonly onChange: (formation: Formation) => void
}) {
  return (
    <fieldset className="formation-fieldset">
      <legend>{side === 'HAN' ? '한 진영 배치' : '초 진영 배치'}</legend>
      <div className="formation-options">
        {FORMATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            className="formation-option"
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            <span className="formation-pieces" aria-hidden="true">{option.pieces}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function SetupScreen() {
  const { dispatch } = useGame()
  const [han, setHan] = useState<Formation>('MSMS')
  const [cho, setCho] = useState<Formation>('MSMS')
  const [bikjang, setBikjang] = useState(DEFAULT_CONFIG.bikjang)
  const [repetitionCount, setRepetitionCount] = useState(DEFAULT_CONFIG.repetitionCount)
  const preview = createInitialState({ han, cho }, { bikjang, repetitionCount })

  return (
    <main className="setup-screen">
      <header className="brand-header setup-header">
        <div className="brand-lockup">
          <span className="brand-seal" aria-hidden="true">將</span>
          <div>
            <p className="eyebrow">KOREAN CHESS</p>
            <h1>두는 장기</h1>
          </div>
        </div>
        <span className="mode-badge"><Users aria-hidden="true" /> 로컬 2인</span>
      </header>

      <div className="setup-layout">
        <section className="setup-controls" aria-labelledby="setup-title">
          <div className="section-heading">
            <p className="eyebrow">對局 準備</p>
            <h2 id="setup-title">대국 설정</h2>
          </div>

          <FormationPicker side="CHO" value={cho} onChange={setCho} />
          <FormationPicker side="HAN" value={han} onChange={setHan} />

          <div className="rule-options">
            <label className="toggle-row">
              <span>
                <strong>빅장 판정</strong>
                <small>양 궁이 마주보면 점수로 승부</small>
              </span>
              <input
                type="checkbox"
                checked={bikjang}
                onChange={(event) => setBikjang(event.target.checked)}
              />
            </label>
            <label className="select-row">
              <span>
                <strong>반복 국면</strong>
                <small>동일 국면 판정 횟수</small>
              </span>
              <select
                value={repetitionCount}
                onChange={(event) => setRepetitionCount(Number(event.target.value))}
              >
                <option value="3">3회</option>
                <option value="4">4회</option>
                <option value="5">5회</option>
              </select>
            </label>
          </div>

          <div className="setup-summary">
            <ShieldCheck aria-hidden="true" />
            <span>초 선수 · 한 1.5점 덤 · 한 수 쉬기 허용</span>
          </div>

          <button
            className="primary-button start-button"
            type="button"
            onClick={() => dispatch({
              type: 'START',
              setup: { han, cho },
              config: { bikjang, repetitionCount },
              now: Date.now(),
            })}
          >
            <Play aria-hidden="true" /> 대국 시작
          </button>
        </section>

        <section className="setup-preview" aria-label="선택한 초기 배치 미리보기">
          <div className="preview-caption">
            <span>초</span>
            <strong>{FORMATION_OPTIONS.find((option) => option.value === cho)?.label}</strong>
          </div>
          <Board
            board={preview.board}
            selected={null}
            legalMoves={[]}
            lastMove={null}
            checkedGeneral={null}
            flipped={false}
            labelMode="HANJA"
            colorBlind={false}
            disabled
            onPositionActivate={() => undefined}
            onDragMove={() => undefined}
          />
          <div className="preview-caption preview-caption--han">
            <span>한</span>
            <strong>{FORMATION_OPTIONS.find((option) => option.value === han)?.label}</strong>
          </div>
        </section>
      </div>
    </main>
  )
}