import { Play } from 'lucide-react'
import { useState } from 'react'
import { PIECE_SETUPS } from '../engine/types'
import type { GameConfig, PieceSetup, Side } from '../engine/types'

const setupLabels: Record<PieceSetup, string> = {
  MA_SANG_MA_SANG: '마상마상',
  SANG_MA_SANG_MA: '상마상마',
  MA_SANG_SANG_MA: '마상상마',
  SANG_MA_MA_SANG: '상마마상',
}

const setupPieces: Record<PieceSetup, readonly string[]> = {
  MA_SANG_MA_SANG: ['馬', '象', '馬', '象'],
  SANG_MA_SANG_MA: ['象', '馬', '象', '馬'],
  MA_SANG_SANG_MA: ['馬', '象', '象', '馬'],
  SANG_MA_MA_SANG: ['象', '馬', '馬', '象'],
}

const REPETITION_CHOICES = [2, 3, 4] as const

interface FormationPickerProps {
  side: Side
  selected: PieceSetup
  onChange: (setup: PieceSetup) => void
}

function FormationPicker({ side, selected, onChange }: FormationPickerProps) {
  const sideName = side === 'HAN' ? '한' : '초'
  return (
    <fieldset className={`formation-picker formation-${side.toLowerCase()}`}>
      <legend>{sideName} 진영 배치</legend>
      <div className="formation-options" role="radiogroup" aria-label={`${sideName} 진영 마상 배치`}>
        {PIECE_SETUPS.map((setup) => (
          <button
            key={setup}
            type="button"
            role="radio"
            aria-checked={selected === setup}
            className={selected === setup ? 'formation-option is-selected' : 'formation-option'}
            onClick={() => onChange(setup)}
          >
            <span className="formation-glyphs" aria-hidden="true">
              {setupPieces[setup].map((piece, index) => (
                <span key={`${setup}-${index}`}>{piece}</span>
              ))}
            </span>
            <span>{setupLabels[setup]}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

interface SetupScreenProps {
  startGame: (config: GameConfig) => void
}

export function SetupScreen({ startGame }: SetupScreenProps) {
  const [hanSetup, setHanSetup] = useState<PieceSetup>('MA_SANG_MA_SANG')
  const [choSetup, setChoSetup] = useState<PieceSetup>('MA_SANG_MA_SANG')
  const [bikjangEnabled, setBikjangEnabled] = useState(true)
  const [repetitionLimit, setRepetitionLimit] = useState<number>(3)

  const startLocalGame = (): void => {
    startGame({ hanSetup, choSetup, bikjangEnabled, repetitionLimit })
  }

  return (
    <section className="setup-screen" aria-labelledby="setup-title">
      <div className="setup-heading">
        <p className="eyebrow">LOCAL MATCH</p>
        <h1 id="setup-title">장기</h1>
        <p>한 기기에서 두 사람이 마주 앉아 두는 장기. 초가 먼저 둡니다.</p>
      </div>

      <div className="setup-boardline" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="formation-grid">
        <FormationPicker side="CHO" selected={choSetup} onChange={setChoSetup} />
        <FormationPicker side="HAN" selected={hanSetup} onChange={setHanSetup} />
      </div>

      <fieldset className="rule-options">
        <legend>규칙 설정</legend>
        <label className="rule-toggle">
          <input
            type="checkbox"
            checked={bikjangEnabled}
            onChange={(event) => setBikjangEnabled(event.target.checked)}
          />
          <span>
            빅장 적용
            <small>두 궁이 마주 보면 대국을 끝내고 점수로 승부를 가립니다.</small>
          </span>
        </label>

        <div className="rule-field" role="radiogroup" aria-label="반복 국면 판정 횟수">
          <span className="rule-field-label">
            같은 국면 반복
            <small>같은 국면이 이 횟수만큼 나오면 점수로 승부를 가립니다.</small>
          </span>
          <div className="rule-choices">
            {REPETITION_CHOICES.map((count) => (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={repetitionLimit === count}
                className={repetitionLimit === count ? 'rule-choice is-selected' : 'rule-choice'}
                onClick={() => setRepetitionLimit(count)}
              >
                {count}회
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="setup-actions">
        <p>준비가 되면 대국을 시작하세요.</p>
        <button type="button" className="primary-command" onClick={startLocalGame}>
          <Play size={18} strokeWidth={2.3} aria-hidden="true" />
          대국 시작
        </button>
      </div>
    </section>
  )
}
