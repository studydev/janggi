/**
 * 기보 목록과 리플레이 조작 (P9).
 * 표기 문자열은 전부 engine/janggi-notation.ts 가 만든다 — 여기서 조립하지 않는다.
 */
import { useEffect, useRef } from 'react';
import { formatMove } from '../../engine/janggi-notation';
import type { Move } from '../../engine/types';
import type { Settings } from '../settings';

export interface MoveListProps {
  moves: readonly Move[];
  /** 지금 보고 있는 시점(둔 수의 개수). 실시간이면 moves.length. */
  viewPly: number;
  settings: Settings;
  onGoto: (ply: number) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function MoveList({
  moves,
  viewPly,
  settings,
  onGoto,
  onExport,
  onImport,
}: MoveListProps): JSX.Element {
  const listRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector('.current');
    el?.scrollIntoView({ block: 'nearest' });
  }, [viewPly]);

  const rows: { no: number; cho?: Move; han?: Move; choPly: number; hanPly: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      no: Math.floor(i / 2) + 1,
      cho: moves[i],
      han: moves[i + 1],
      choPly: i + 1,
      hanPly: i + 2,
    });
  }

  const atStart = viewPly === 0;
  const atEnd = viewPly === moves.length;

  return (
    <div className="panel">
      <h2 className="panel-title">기보</h2>

      <div className="btn-row" style={{ marginBottom: 8 }}>
        <button className="btn btn-sm" onClick={() => onGoto(0)} disabled={atStart} aria-label="처음으로">
          ⏮ 처음
        </button>
        <button
          className="btn btn-sm"
          onClick={() => onGoto(viewPly - 1)}
          disabled={atStart}
          aria-label="이전 수"
        >
          ◀ 이전
        </button>
        <button
          className="btn btn-sm"
          onClick={() => onGoto(viewPly + 1)}
          disabled={atEnd}
          aria-label="다음 수"
        >
          다음 ▶
        </button>
        <button
          className="btn btn-sm"
          onClick={() => onGoto(moves.length)}
          disabled={atEnd}
          aria-label="마지막으로"
        >
          마지막 ⏭
        </button>
      </div>

      {!atEnd && (
        <p className="empty-note" style={{ marginTop: 0 }}>
          다시보기 중입니다. 착수하려면 「마지막」으로 돌아오세요.
        </p>
      )}

      {moves.length === 0 ? (
        <p className="empty-note">아직 둔 수가 없습니다.</p>
      ) : (
        <ol className="move-list" ref={listRef}>
          {rows.map((row) => (
            <li key={row.no}>
              <span className="no">{row.no}.</span>
              <MoveCell move={row.cho} ply={row.choPly} viewPly={viewPly} settings={settings} onGoto={onGoto} />
              <MoveCell move={row.han} ply={row.hanPly} viewPly={viewPly} settings={settings} onGoto={onGoto} />
            </li>
          ))}
        </ol>
      )}

      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="btn btn-sm" onClick={onExport} disabled={moves.length === 0}>
          JSON 내보내기
        </button>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          불러오기
          <input
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}

function MoveCell({
  move,
  ply,
  viewPly,
  settings,
  onGoto,
}: {
  move: Move | undefined;
  ply: number;
  viewPly: number;
  settings: Settings;
  onGoto: (ply: number) => void;
}): JSX.Element {
  if (move === undefined) return <span />;
  const text = formatMove(move, { pieceStyle: settings.pieceStyle });
  const verbose = formatMove(move, { style: 'verbose', pieceStyle: 'hangul' });
  return (
    <button
      type="button"
      className={ply === viewPly ? 'current' : undefined}
      onClick={() => onGoto(ply)}
      aria-label={`${ply}수: ${verbose}`}
      title={verbose}
    >
      {text}
    </button>
  );
}
