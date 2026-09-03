export function ReplayControls({
  ply,
  total,
  onSeek,
  onStep,
  onExit,
}: {
  ply: number
  total: number
  onSeek: (ply: number) => void
  onStep: (delta: number) => void
  onExit: () => void
}) {
  return (
    <section className="panel replay-panel" aria-label="기보 재생">
      <div className="replay-head">
        <h2 className="panel-title">기보 재생</h2>
        <span className="replay-count">
          {ply} / {total}
        </span>
      </div>
      <div className="replay-buttons">
        <button type="button" className="btn btn-icon" onClick={() => onSeek(0)} disabled={ply === 0} aria-label="처음">
          ⏮
        </button>
        <button type="button" className="btn btn-icon" onClick={() => onStep(-1)} disabled={ply === 0} aria-label="이전 수">
          ◀
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => onStep(1)}
          disabled={ply === total}
          aria-label="다음 수"
        >
          ▶
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => onSeek(total)}
          disabled={ply === total}
          aria-label="마지막"
        >
          ⏭
        </button>
      </div>
      <input
        type="range"
        className="replay-slider"
        min={0}
        max={total}
        value={ply}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="기보 위치"
      />
      <button type="button" className="btn btn-block" onClick={onExit}>
        재생 종료 · 현재 국면으로
      </button>
    </section>
  )
}
