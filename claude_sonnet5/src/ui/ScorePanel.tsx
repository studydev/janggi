import type { Side } from '../engine/types'
import { HAN_BONUS } from '../engine/types'

export function ScorePanel({ scores }: { scores: Record<Side, number> }) {
  const total = scores.CHO + scores.HAN || 1
  const choPct = (scores.CHO / total) * 100

  return (
    <section className="panel score-panel" aria-label="점수">
      <h2 className="panel-title">점수</h2>
      <div className="score-bar" role="img" aria-label={`초 ${scores.CHO}점, 한 ${scores.HAN}점`}>
        <span className="score-bar-cho" style={{ width: `${choPct}%` }} />
        <span className="score-bar-han" style={{ width: `${100 - choPct}%` }} />
      </div>
      <div className="score-values">
        <span className="score-cho">
          초 <strong>{scores.CHO}</strong>
        </span>
        <span className="score-han">
          한 <strong>{scores.HAN}</strong> <small>(덤 +{HAN_BONUS})</small>
        </span>
      </div>
    </section>
  )
}
