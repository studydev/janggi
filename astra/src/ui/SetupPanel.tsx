import { ArrowRight, UsersRound } from 'lucide-react'
import { SETUP_PIECES } from '../engine/board'
import { pieceLabel, SIDE_NAMES } from '../engine/janggi-notation'
import type { PieceSetup, Side } from '../engine/types'
import { PieceGlyph } from './Board'
import { useGame } from './game-context'

function Arrangement({ side }: { side: Side }) {
  const { state, dispatch } = useGame()
  const setting = side === 'CHO' ? 'choSetup' : 'hanSetup'
  return <fieldset className={`arrangement side--${side}`}>
    <legend><span className="side-dot" />{SIDE_NAMES[side]} 진영 <span className="field-note">{side === 'CHO' ? '선수' : '후수'}</span></legend>
    <div className="arrangement-options">
      {(Object.keys(SETUP_PIECES) as PieceSetup[]).map((setup) => {
        const label = SETUP_PIECES[setup].map((type) => pieceLabel({ type, side }, 'hangul')).join('')
        return <label className={`arrangement-option ${state.settings[setting] === setup ? 'is-chosen' : ''}`} key={setup}>
          <span className="arrangement-name"><input type="radio" name={`${side}-arrangement`} value={setup} checked={state.settings[setting] === setup}
            aria-label={`${SIDE_NAMES[side]} ${label}`} onChange={() => dispatch({ type: 'CONFIGURE', settings: { [setting]: setup } })} />{label}</span>
          <svg viewBox="0 0 224 48" className="arrangement-preview" aria-hidden="true">
            {SETUP_PIECES[setup].map((type, index) => <g key={index} transform={`translate(${28 + index * 56},24) scale(0.78)`}><PieceGlyph piece={{ type, side }} /></g>)}
          </svg>
        </label>
      })}
    </div>
  </fieldset>
}

export function SetupPanel() {
  const { state, dispatch } = useGame()
  return <section id="match-setup" className="setup-panel" aria-labelledby="setup-title">
    <div className="panel-heading"><div><span className="eyebrow">NEW MATCH</span><h2 id="setup-title">대국 준비</h2></div><UsersRound size={24} strokeWidth={1.4} aria-hidden="true" /></div>
    <div className="mode-summary"><span>대국 방식</span><strong>로컬 2인</strong></div>
    <Arrangement side="CHO" />
    <Arrangement side="HAN" />
    <div className="rule-options">
      <label className="toggle-row" htmlFor="bikjang"><span>빅장 점수제</span><input id="bikjang" type="checkbox" className="switch" checked={state.settings.config.bikjangEnabled}
        onChange={(event) => dispatch({ type: 'CONFIGURE', settings: { config: { bikjangEnabled: event.target.checked } } })} /></label>
      <label className="select-row" htmlFor="repetition"><span>반복 국면</span><select id="repetition" value={state.settings.config.repetitionCount}
        onChange={(event) => dispatch({ type: 'CONFIGURE', settings: { config: { repetitionCount: Number(event.target.value) } } })}>
        {[2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}회</option>)}
      </select></label>
    </div>
    <button className="button primary start-button" type="button" onClick={() => dispatch({ type: 'START' })}>대국 시작 <ArrowRight size={19} aria-hidden="true" /></button>
  </section>
}