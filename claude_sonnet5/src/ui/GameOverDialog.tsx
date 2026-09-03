import { useEffect, useRef } from 'react'
import type { DisplayResult } from '../game/session-types'
import { sideLabel } from './pieceLabels'

export function GameOverDialog({
  result,
  onNewGame,
  onReview,
  onExport,
}: {
  result: DisplayResult
  onNewGame: () => void
  onReview: () => void
  onExport: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])

  const headline =
    result.winner === null
      ? '무승부'
      : `${sideLabel(result.winner)} 승리`

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="go-title">
        <h2 id="go-title" className="modal-title">
          {headline}
        </h2>
        <p className="modal-reason">{result.reason || statusText(result.status)}</p>
        <dl className="modal-scores">
          <div>
            <dt>초</dt>
            <dd>{result.scores.CHO}</dd>
          </div>
          <div>
            <dt>한</dt>
            <dd>{result.scores.HAN}</dd>
          </div>
        </dl>
        <div className="modal-actions">
          <button ref={ref} type="button" className="btn btn-primary" onClick={onNewGame}>
            새 대국
          </button>
          <button type="button" className="btn" onClick={onReview}>
            기보 다시 보기
          </button>
          <button type="button" className="btn" onClick={onExport}>
            기보 내보내기
          </button>
        </div>
      </div>
    </div>
  )
}

function statusText(status: DisplayResult['status']): string {
  switch (status) {
    case 'CHECKMATE':
      return '외통'
    case 'BIKJANG':
      return '빅장'
    case 'REPETITION':
      return '국면 반복'
    case 'RESIGN':
      return '기권'
    case 'DRAW_AGREED':
      return '합의 무승부'
    default:
      return ''
  }
}
