import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { replayMoves } from '../engine/rules';
import { SIDE_LABEL } from '../engine/result';
import { SIDE_NAME } from '../engine/janggi-notation';
import { SETUP_LABELS } from '../engine/types';
import type { Position } from '../engine/types';
import { checkedGungPosition, isLive, resultOf } from '../state/gameReducer';
import type { Action, AppState } from '../state/gameReducer';
import { downloadRecord, fromRecord, parseRecord, toRecord } from '../state/storage';
import { Board } from './Board';
import { CapturedPanel } from './CapturedPanel';
import { MoveList } from './MoveList';
import { ResultDialog } from './ResultDialog';

export interface GameScreenProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const ARROW_DELTAS: Record<string, { df: number; dr: number }> = {
  ArrowUp: { df: 0, dr: -1 },
  ArrowDown: { df: 0, dr: 1 },
  ArrowLeft: { df: -1, dr: 0 },
  ArrowRight: { df: 1, dr: 0 },
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useElapsedSeconds(startedAt: number, running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function GameScreen({ state, dispatch }: GameScreenProps) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [ioError, setIoError] = useState<string | null>(null);
  const [dialogClosed, setDialogClosed] = useState(false);

  const result = resultOf(state);
  const live = isLive(state);
  const elapsed = useElapsedSeconds(state.startedAt, result.status === 'PLAYING');

  const displayed = useMemo(() => {
    if (state.replayPly === null) return state.game;
    return replayMoves(
      state.game.setup,
      state.game.config,
      state.game.moveHistory.slice(0, state.replayPly),
    );
  }, [state.game, state.replayPly]);

  const lastMove = useMemo(() => {
    const move = displayed.moveHistory[displayed.moveHistory.length - 1];
    if (!move || move.isPass) return null;
    return { from: move.from, to: move.to };
  }, [displayed]);

  useEffect(() => {
    setDialogClosed(false);
  }, [result.status]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const delta = ARROW_DELTAS[event.key];
    if (delta) {
      event.preventDefault();
      const sign = state.options.flipped ? -1 : 1;
      dispatch({ type: 'MOVE_CURSOR', df: delta.df * sign, dr: delta.dr * sign });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch({ type: 'ACTIVATE_CURSOR' });
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const game = fromRecord(parseRecord(await file.text()));
      setIoError(null);
      dispatch({ type: 'RESUME', game });
    } catch (error) {
      setIoError(`기보를 읽지 못했다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const totalPlies = state.game.moveHistory.length;
  const viewingPly = state.replayPly ?? totalPlies;
  const press = (pos: Position) => dispatch({ type: 'PRESS', pos });
  const drop = (pos: Position) => dispatch({ type: 'DROP', pos });

  return (
    <div className="game">
      <div className="game__board">
        <div className="game__turn">
          <span className={`badge badge--${displayed.turn.toLowerCase()}`}>{SIDE_LABEL[displayed.turn]} 차례</span>
          <span className="game__clock" aria-label="경과 시간">
            {formatElapsed(elapsed)}
          </span>
        </div>

        <div
          className="boardwrap"
          tabIndex={0}
          role="application"
          aria-label="장기판. 방향키로 지점을 옮기고 Enter로 선택한다."
          onKeyDown={handleKeyDown}
        >
          <Board
            board={displayed.board}
            flipped={state.options.flipped}
            labelMode={state.options.labelMode}
            colorBlind={state.options.colorBlind}
            selected={live ? state.selected : null}
            targets={live ? state.targets : []}
            lastMove={lastMove}
            checkAt={checkedGungPosition(displayed)}
            cursor={live ? state.cursor : null}
            interactive={live}
            onPress={press}
            onRelease={drop}
          />
        </div>

        <p className="status" role="status" aria-live="polite">
          {state.replayPly !== null ? `리플레이 ${viewingPly}/${totalPlies}수 — 착수할 수 없다.` : state.message}
        </p>
      </div>

      <aside className="game__panel">
        <section className="panel__block">
          <h2 className="sr-only">대국 정보</h2>
          <p className="panel__setup">
            한 {SETUP_LABELS[state.game.setup.HAN]} · 초 {SETUP_LABELS[state.game.setup.CHO]}
          </p>
          <CapturedPanel game={displayed} labelMode={state.options.labelMode} />
        </section>

        <section className="panel__block">
          <h2 className="sr-only">착수 조작</h2>
          <div className="btnrow">
            <button type="button" className="btn" disabled={!live} onClick={() => dispatch({ type: 'PASS' })}>
              한 수 쉬기
            </button>
            <button
              type="button"
              className="btn"
              disabled={totalPlies === 0}
              onClick={() => dispatch({ type: 'UNDO' })}
            >
              무르기
            </button>
            <button
              type="button"
              className="btn"
              disabled={!live}
              onClick={() => dispatch({ type: 'RESIGN', side: state.game.turn })}
            >
              {SIDE_NAME[state.game.turn]} 기권
            </button>
            <button
              type="button"
              className="btn"
              disabled={!live}
              onClick={() => dispatch({ type: 'OFFER_DRAW', side: state.game.turn })}
            >
              무승부 제안
            </button>
          </div>

          {state.drawOffer && (
            <div className="notice">
              <span>{SIDE_NAME[state.drawOffer]}이(가) 무승부를 제안했다.</span>
              <div className="notice__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => dispatch({ type: 'RESPOND_DRAW', accept: true })}
                >
                  수락
                </button>
                <button type="button" className="btn" onClick={() => dispatch({ type: 'RESPOND_DRAW', accept: false })}>
                  거절
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="panel__block panel__block--grow">
          <MoveList
            moves={state.game.moveHistory}
            replayPly={state.replayPly}
            onGoto={(ply) => dispatch({ type: 'REPLAY_GOTO', ply })}
          />
          <div className="btnrow btnrow--tight">
            <button
              type="button"
              className="btn btn--icon"
              aria-label="처음 국면"
              disabled={totalPlies === 0 || viewingPly === 0}
              onClick={() => dispatch({ type: 'REPLAY_GOTO', ply: 0 })}
            >
              ⏮
            </button>
            <button
              type="button"
              className="btn btn--icon"
              aria-label="이전 수"
              disabled={viewingPly === 0}
              onClick={() => dispatch({ type: 'REPLAY_GOTO', ply: viewingPly - 1 })}
            >
              ◀
            </button>
            <button
              type="button"
              className="btn btn--icon"
              aria-label="다음 수"
              disabled={viewingPly >= totalPlies}
              onClick={() => dispatch({ type: 'REPLAY_GOTO', ply: viewingPly + 1 })}
            >
              ▶
            </button>
            <button
              type="button"
              className="btn btn--icon"
              aria-label="마지막 국면"
              disabled={state.replayPly === null}
              onClick={() => dispatch({ type: 'REPLAY_GOTO', ply: null })}
            >
              ⏭
            </button>
          </div>
        </section>

        <section className="panel__block">
          <h2 className="sr-only">보기 설정</h2>
          <div className="btnrow">
            <button
              type="button"
              className="btn"
              aria-pressed={state.options.flipped}
              onClick={() => dispatch({ type: 'SET_OPTIONS', options: { flipped: !state.options.flipped } })}
            >
              보드 뒤집기
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                dispatch({
                  type: 'SET_OPTIONS',
                  options: { labelMode: state.options.labelMode === 'HANJA' ? 'HANGUL' : 'HANJA' },
                })
              }
            >
              {state.options.labelMode === 'HANJA' ? '한글 표기' : '한자 표기'}
            </button>
            <button
              type="button"
              className="btn"
              aria-pressed={state.options.colorBlind}
              onClick={() => dispatch({ type: 'SET_OPTIONS', options: { colorBlind: !state.options.colorBlind } })}
            >
              색약 팔레트
            </button>
          </div>
          <div className="btnrow">
            <button type="button" className="btn" onClick={() => downloadRecord(toRecord(state.game))}>
              기보 내보내기
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              기보 불러오기
            </button>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'NEW_GAME' })}>
              새 대국
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label="기보 파일 선택"
            onChange={handleImport}
          />
          {ioError && <p className="notice notice--warn">{ioError}</p>}
        </section>
      </aside>

      {result.status !== 'PLAYING' && !dialogClosed && (
        <ResultDialog
          result={result}
          game={state.game}
          onNewGame={() => dispatch({ type: 'NEW_GAME' })}
          onReview={() => setDialogClosed(true)}
        />
      )}
    </div>
  );
}
