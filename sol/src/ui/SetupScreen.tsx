import { Play, RotateCcw, Users } from 'lucide-react'
import type { PieceSetup, Side } from '../engine/types'
import { useGame } from './GameContext'

const SETUP_OPTIONS: readonly { value: PieceSetup; label: string; pieces: readonly string[] }[] = [
  { value: 'MSMS', label: '마상마상', pieces: ['마', '상', '마', '상'] },
  { value: 'SMSM', label: '상마상마', pieces: ['상', '마', '상', '마'] },
  { value: 'MSSM', label: '마상상마', pieces: ['마', '상', '상', '마'] },
  { value: 'SMMS', label: '상마마상', pieces: ['상', '마', '마', '상'] },
]

function SetupSelector({ side, value }: { readonly side: Side; readonly value: PieceSetup }) {
  const { dispatch } = useGame()
  const sideName = side === 'CHO' ? '초' : '한'

  return (
    <fieldset className={`setup-selector setup-selector--${side.toLowerCase()}`}>
      <legend>
        <span className="side-mark" aria-hidden="true">{side === 'CHO' ? '楚' : '漢'}</span>
        {sideName} 마상 배치
      </legend>
      <div className="setup-options">
        {SETUP_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="setup-option"
            aria-pressed={value === option.value}
            onClick={() => dispatch({ type: 'SET_SETUP', side, setup: option.value })}
          >
            <span className="setup-pieces" aria-hidden="true">
              {option.pieces.map((piece, index) => <span key={`${piece}-${index}`}>{piece}</span>)}
            </span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function SetupScreen() {
  const { state, dispatch } = useGame()
  const { preferences } = state

  return (
    <main className="setup-screen">
      <header className="setup-header">
        <div className="brand-lockup">
          <span className="brand-seal" aria-hidden="true">將</span>
          <div>
            <p className="eyebrow">Korean chess</p>
            <h1>장기</h1>
          </div>
        </div>
        <div className="mode-chip"><Users size={18} aria-hidden="true" /> 로컬 2인</div>
      </header>

      <section className="setup-band" aria-labelledby="formation-title">
        <div className="section-heading">
          <span>01</span>
          <h2 id="formation-title">마상 배치</h2>
        </div>
        <div className="setup-sides">
          <SetupSelector side="CHO" value={preferences.choSetup} />
          <SetupSelector side="HAN" value={preferences.hanSetup} />
        </div>
      </section>

      <section className="setup-band" aria-labelledby="options-title">
        <div className="section-heading">
          <span>02</span>
          <h2 id="options-title">대국 설정</h2>
        </div>
        <div className="settings-grid">
          <div className="setting-row">
            <span>기물 표기</span>
            <div className="segmented-control" aria-label="기물 표기">
              <button
                type="button"
                aria-pressed={preferences.labelStyle === 'HANJA'}
                onClick={() => dispatch({ type: 'SET_LABEL_STYLE', style: 'HANJA' })}
              >
                한자
              </button>
              <button
                type="button"
                aria-pressed={preferences.labelStyle === 'HANGUL'}
                onClick={() => dispatch({ type: 'SET_LABEL_STYLE', style: 'HANGUL' })}
              >
                한글
              </button>
            </div>
          </div>
          <label className="setting-row toggle-row">
            <span>빅장 규칙</span>
            <input
              type="checkbox"
              checked={preferences.bikjangEnabled}
              onChange={(event) => dispatch({ type: 'SET_BIKJANG', enabled: event.target.checked })}
            />
            <span className="toggle" aria-hidden="true" />
          </label>
          <label className="setting-row toggle-row">
            <span>색맹 대응 팔레트</span>
            <input
              type="checkbox"
              checked={preferences.colorBlindMode}
              onChange={() => dispatch({ type: 'TOGGLE_COLOR_BLIND' })}
            />
            <span className="toggle" aria-hidden="true" />
          </label>
        </div>
      </section>

      <footer className="setup-actions">
        <div className="first-turn"><span>선수</span><strong>초 楚</strong></div>
        <button className="primary-action" type="button" onClick={() => dispatch({ type: 'START', now: Date.now() })}>
          <Play size={20} fill="currentColor" aria-hidden="true" /> 대국 시작
        </button>
      </footer>

      {state.savedGame && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="resume-title">
            <span className="dialog-mark" aria-hidden="true"><RotateCcw size={24} /></span>
            <h2 id="resume-title">진행 중인 대국</h2>
            <p>{state.savedGame.moveHistory.length}수까지 저장되어 있습니다.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-action" onClick={() => dispatch({ type: 'DISCARD_RESUME' })}>
                새 대국
              </button>
              <button type="button" className="primary-action" onClick={() => dispatch({ type: 'RESUME', now: Date.now() })}>
                이어두기
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}