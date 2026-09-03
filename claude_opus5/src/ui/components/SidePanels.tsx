/**
 * 대국 화면 사이드 패널들: 차례 / 점수 / 잡힌 기물 / 경과 시간.
 * 모두 props 만 그린다.
 */
import { useEffect, useState } from 'react';
import { SIDE_LABEL } from '../../engine/board';
import { pieceLabel } from '../../engine/janggi-notation';
import type { GameState, PieceType, Side } from '../../engine/types';
import { opponent, PIECE_VALUES } from '../../engine/types';
import { PALETTES, type Settings } from '../settings';

const SIDES: readonly Side[] = ['CHO', 'HAN'];

/* ------------------------------ 차례 ------------------------------ */

export function TurnBanner({
  turn,
  inCheck,
  settings,
  replaying,
}: {
  turn: Side;
  inCheck: boolean;
  settings: Settings;
  replaying: boolean;
}): JSX.Element {
  const color = PALETTES[settings.palette][turn];
  return (
    <div className="panel">
      <div className="turn-banner" style={{ color }}>
        <span className={`side-dot${settings.distinctShapes && turn === 'HAN' ? ' shape-han' : ''}`} />
        <span>{replaying ? '기보 다시보기' : `${SIDE_LABEL[turn]} 차례`}</span>
      </div>
      <div aria-live="polite" style={{ minHeight: 22 }}>
        {inCheck && !replaying && (
          <strong style={{ color: 'var(--danger)' }}>장군! 반드시 멍군해야 합니다.</strong>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ 점수 ------------------------------ */

export function ScorePanel({
  scores,
  settings,
  hanBonus,
}: {
  scores: Readonly<Record<Side, number>>;
  settings: Settings;
  hanBonus: number;
}): JSX.Element {
  const max = Math.max(scores.HAN, scores.CHO, 1);
  return (
    <div className="panel">
      <h2 className="panel-title">점수</h2>
      <div className="score-grid">
        {SIDES.map((side) => (
          <Row key={side} side={side} value={scores[side]} max={max} settings={settings} />
        ))}
      </div>
      <p className="empty-note" style={{ margin: '8px 0 0' }}>
        차13 · 포7 · 마5 · 상3 · 사3 · 졸2 · 궁0, 한 덤 +{hanBonus}
      </p>
    </div>
  );
}

function Row({
  side,
  value,
  max,
  settings,
}: {
  side: Side;
  value: number;
  max: number;
  settings: Settings;
}): JSX.Element {
  const color = PALETTES[settings.palette][side];
  return (
    <>
      <span style={{ color }}>{SIDE_LABEL[side]}</span>
      <span className="score-bar">
        <span style={{ width: `${(value / max) * 100}%`, background: color }} />
      </span>
      <span className="score-value">{value}</span>
    </>
  );
}

/* --------------------------- 잡힌 기물 --------------------------- */

export function CapturedPanel({
  game,
  settings,
}: {
  game: GameState;
  settings: Settings;
}): JSX.Element {
  return (
    <div className="panel">
      <h2 className="panel-title">잡힌 기물</h2>
      {SIDES.map((side) => {
        const taken = game.capturedPieces[side];
        const lostSide = opponent(side);
        const total = taken.reduce((sum, t) => sum + PIECE_VALUES[t], 0);
        return (
          <div key={side} style={{ marginBottom: 8 }}>
            <div className="stat-row">
              <span className="label" style={{ color: PALETTES[settings.palette][side] }}>
                {SIDE_LABEL[side]} 획득
              </span>
              <span className="value">{total > 0 ? `+${total}점` : '—'}</span>
            </div>
            <div className="captured-row">
              {taken.length === 0 ? (
                <span className="empty-note">없음</span>
              ) : (
                sortByValue(taken).map((type, i) => (
                  <span
                    key={i}
                    className="captured-chip"
                    style={{ color: PALETTES[settings.palette][lostSide] }}
                    title={`${SIDE_LABEL[lostSide]} ${pieceLabel(type, lostSide, 'hangul')}`}
                  >
                    {pieceLabel(type, lostSide, settings.pieceStyle)}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function sortByValue(types: readonly PieceType[]): PieceType[] {
  return [...types].sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]);
}

/* --------------------------- 경과 시간 --------------------------- */

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameStats({
  startedAt,
  endedAt,
  plies,
  repetition,
}: {
  startedAt: number | null;
  endedAt: number | null;
  plies: number;
  repetition: number;
}): JSX.Element {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null || endedAt !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, endedAt]);

  const elapsed = startedAt === null ? 0 : (endedAt ?? now) - startedAt;

  return (
    <div className="panel">
      <h2 className="panel-title">대국 정보</h2>
      <div className="stat-row">
        <span className="label">경과 시간</span>
        <span className="value">{formatDuration(elapsed)}</span>
      </div>
      <div className="stat-row">
        <span className="label">둔 수</span>
        <span className="value">{plies}</span>
      </div>
      <div className="stat-row">
        <span className="label">현 국면 반복</span>
        <span className="value">{repetition}회</span>
      </div>
    </div>
  );
}
