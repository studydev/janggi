/**
 * 대국 설정 화면 — 마·상 배치(양쪽) 선택 + 미리보기, 대국 방식, 규칙 옵션,
 * 저장된 대국 불러오기.
 */

import { useRef, useState } from 'react'
import { formationPieces } from '../engine/board'
import { ALL_FORMATIONS, FORMATION_LABEL, type Formation } from '../engine/types'
import { parseGameRecord, sessionFromRecord } from '../game/storage'
import { DEFAULT_SETUP, type Session, type SetupChoices } from '../game/session-types'
import { pieceGlyph, sideLabel } from './pieceLabels'
import type { Side } from '../engine/types'

function FormationPreview({ side, formation }: { side: Side; formation: Formation }) {
  const [f2, f3, f7, f8] = formationPieces(formation)
  const row = ['CHA', f2, f3, 'SA', 'GUNG', 'SA', f7, f8, 'CHA'] as const
  return (
    <div className="fp-row" aria-hidden="true">
      {row.map((t, i) => (
        <span key={i} className={`fp-cell fp-${side.toLowerCase()}`}>
          {pieceGlyph(side, t, 'hanja')}
        </span>
      ))}
    </div>
  )
}

function FormationPicker({
  side,
  value,
  onChange,
}: {
  side: Side
  value: Formation
  onChange: (f: Formation) => void
}) {
  return (
    <fieldset className="setup-fieldset">
      <legend>{sideLabel(side)} 진영 · 마상 배치</legend>
      <div className="formation-grid">
        {ALL_FORMATIONS.map((f) => (
          <label key={f} className={`formation-option${value === f ? ' is-active' : ''}`}>
            <input
              type="radio"
              name={`formation-${side}`}
              value={f}
              checked={value === f}
              onChange={() => onChange(f)}
            />
            <span className="formation-name">{FORMATION_LABEL[f]}</span>
            <FormationPreview side={side} formation={f} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function SetupScreen({
  onStart,
  onLoadSession,
}: {
  onStart: (choices: SetupChoices) => void
  onLoadSession: (session: Session) => void
}) {
  const [choices, setChoices] = useState<SetupChoices>(DEFAULT_SETUP)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<SetupChoices>) => setChoices((c) => ({ ...c, ...p }))

  const handleFile = async (file: File) => {
    setImportError(null)
    try {
      const record = parseGameRecord(await file.text())
      onLoadSession(sessionFromRecord(record))
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '불러오기 실패')
    }
  }

  return (
    <div className="screen setup-screen">
      <header className="setup-header">
        <h1>웹 장기</h1>
        <p className="subtitle">將棋 · Janggi — 순수 규칙 엔진 + SVG 보드</p>
      </header>

      <FormationPicker
        side="CHO"
        value={choices.choFormation}
        onChange={(f) => patch({ choFormation: f })}
      />
      <FormationPicker
        side="HAN"
        value={choices.hanFormation}
        onChange={(f) => patch({ hanFormation: f })}
      />

      <fieldset className="setup-fieldset">
        <legend>대국 방식</legend>
        <div className="mode-grid">
          <label className="mode-option is-active">
            <input type="radio" name="mode" checked readOnly />
            로컬 2인 대국
          </label>
          <label className="mode-option is-disabled" aria-disabled="true">
            <input type="radio" name="mode" disabled />
            AI 대국 <span className="badge">이번 버전 제외</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="setup-fieldset">
        <legend>규칙 옵션</legend>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={choices.bikjangDraw}
            onChange={(e) => patch({ bikjangDraw: e.target.checked })}
          />
          빅장(양 궁 정면) 시 무승부 처리
        </label>
        <label className="toggle-row">
          같은 국면 반복 무승부 횟수
          <select
            value={choices.repetitionLimit}
            onChange={(e) => patch({ repetitionLimit: Number(e.target.value) })}
          >
            <option value={3}>3회</option>
            <option value={4}>4회</option>
            <option value={5}>5회</option>
          </select>
        </label>
      </fieldset>

      <div className="setup-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => onStart(choices)}>
          대국 시작
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => fileInputRef.current?.click()}
        >
          대국 파일 불러오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      {importError !== null && <p className="setup-error" role="alert">{importError}</p>}

      <details className="setup-rules">
        <summary>장기 ≠ 샹치 — 이 게임이 지키는 규칙</summary>
        <ul>
          <li>강(河) 없음. 상(象)은 1직진 + 2대각.</li>
          <li>포(包)는 이동·공격 모두 정확히 1개를 넘어야 하고, 포를 넘거나 잡을 수 없다.</li>
          <li>졸/병은 처음부터 좌우 이동 가능, 뒤로는 불가.</li>
          <li>차·궁·사는 궁성 안에서 대각선 이동 가능.</li>
          <li>한 수 쉬기 허용 — 스테일메이트 없음.</li>
        </ul>
      </details>
    </div>
  )
}
