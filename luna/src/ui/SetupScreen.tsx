import { useState } from 'react'
import { HORSE_ELEPHANT_SETUP_OPTIONS, type HorseElephantSetup } from '../engine'
import { useGame } from './useGame'

const setupLabels: Record<HorseElephantSetup, string> = {
  'MA-SANG-MA-SANG': '마상마상',
  'SANG-MA-SANG-MA': '상마상마',
  'MA-SANG-SANG-MA': '마상상마',
  'SANG-MA-MA-SANG': '상마마상',
}

function SetupChoice({
  value,
  selected,
  onSelect,
}: {
  readonly value: HorseElephantSetup
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  const pieces = setupLabels[value].split('')
  return (
    <button className={`setup-choice${selected ? ' is-selected' : ''}`} type="button" aria-pressed={selected} onClick={onSelect}>
      <span className="choice-preview" aria-hidden="true">
        {pieces.map((piece, index) => <span key={`${piece}-${index}`}>{piece}</span>)}
      </span>
      <span className="choice-label">{setupLabels[value]}</span>
    </button>
  )
}

export function SetupScreen() {
  const { dispatch } = useGame()
  const [hanSetup, setHanSetup] = useState<HorseElephantSetup>('MA-SANG-MA-SANG')
  const [choSetup, setChoSetup] = useState<HorseElephantSetup>('MA-SANG-MA-SANG')
  const [bikjangEnabled, setBikjangEnabled] = useState(true)

  return (
    <main className="setup-page">
      <section className="setup-intro">
        <div className="brand-lockup"><span className="brand-mark">將</span><span>장기</span></div>
        <p className="eyebrow">LOCAL TABLE / 09 × 10</p>
        <h1>한 판의 호흡을<br /><em>천천히</em> 고르세요.</h1>
        <p className="intro-copy">초가 선수를 잡고, 서로의 마상 배치를 고른 뒤 시작합니다.</p>
        <div className="setup-stamp"><span className="stamp-dot" /> 로컬 2인 대국</div>
      </section>

      <section className="setup-form" aria-labelledby="setup-heading">
        <div className="section-heading">
          <span className="section-index">01</span>
          <div><p className="eyebrow">OPENING FORMATION</p><h2 id="setup-heading">마상 배치</h2></div>
        </div>

        <div className="player-setup">
          <div className="setup-player-heading"><span className="side-pip han-pip" /><div><strong>한</strong><span>후수</span></div><span className="setup-choice-value">{setupLabels[hanSetup]}</span></div>
          <div className="setup-choice-grid">
            {HORSE_ELEPHANT_SETUP_OPTIONS.map((value) => <SetupChoice key={value} value={value} selected={value === hanSetup} onSelect={() => setHanSetup(value)} />)}
          </div>
        </div>

        <div className="player-setup">
          <div className="setup-player-heading"><span className="side-pip cho-pip" /><div><strong>초</strong><span>선수</span></div><span className="setup-choice-value">{setupLabels[choSetup]}</span></div>
          <div className="setup-choice-grid">
            {HORSE_ELEPHANT_SETUP_OPTIONS.map((value) => <SetupChoice key={value} value={value} selected={value === choSetup} onSelect={() => setChoSetup(value)} />)}
          </div>
        </div>

        <div className="setup-options">
          <label className="toggle-row">
            <input type="checkbox" checked={bikjangEnabled} onChange={(event) => setBikjangEnabled(event.target.checked)} />
            <span className="toggle-control" aria-hidden="true" /><span><strong>빅장 판정</strong><small>마주 보는 궁을 무승부 조건으로 사용</small></span>
          </label>
        </div>

        <button className="start-button" type="button" onClick={() => dispatch({ type: 'START_GAME', hanSetup, choSetup, config: { bikjangEnabled, repetitionLimit: 3 } })}>
          <span>대국 시작</span><span className="button-arrow" aria-hidden="true">↗</span>
        </button>
        <p className="setup-footnote">한 수 쉬기 · 무르기 · 기보 재생 지원</p>
      </section>
    </main>
  )
}