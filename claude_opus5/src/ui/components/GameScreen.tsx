/**
 * 대국 화면 (P8-2, P8-3).
 * 규칙 판단은 전부 엔진 호출로 이뤄지고, 여기서는 배치와 입력만 다룬다.
 */
import { useMemo } from 'react';
import { findGung, SIDE_LABEL } from '../../engine/board';
import { describeMove } from '../../engine/janggi-notation';
import { stateAtPly } from '../../engine/record';
import { repetitionCount } from '../../engine/result';
import { canPass, isCheck } from '../../engine/rules';
import { opponent, type Position, type Side } from '../../engine/types';
import type { Action, AppState } from '../state/gameReducer';
import { Board } from './Board';
import { MoveList } from './MoveList';
import { SettingsPanel } from './SettingsPanel';
import { CapturedPanel, GameStats, ScorePanel, TurnBanner } from './SidePanels';

export interface GameScreenProps {
  state: AppState;
  dispatch: (action: Action) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function GameScreen({ state, dispatch, onExport, onImport }: GameScreenProps): JSX.Element {
  const totalPlies = state.game.moveHistory.length;
  const viewPly = state.replayPly ?? totalPlies;

  const viewGame = useMemo(
    () => (state.replayPly === null ? state.game : stateAtPly(state.game, state.replayPly)),
    [state.game, state.replayPly],
  );

  const replaying = state.replayPly !== null;
  const live = state.phase === 'PLAYING' && !replaying;

  const inCheck = useMemo(() => isCheck(viewGame, viewGame.turn), [viewGame]);
  const checkedGung = inCheck ? findGung(viewGame.board, viewGame.turn) : null;

  const lastMove = viewGame.moveHistory.at(-1);
  const lastHighlight =
    lastMove !== undefined && !lastMove.isPass ? { from: lastMove.from, to: lastMove.to } : null;

  const passable = live && canPass(state.game);
  const turn = viewGame.turn;

  const announce = lastMove
    ? `${describeMove(lastMove)}${inCheck ? '. 장군.' : ''}`
    : '대국이 시작되었습니다.';

  const handleSelect = (at: Position): void => dispatch({ type: 'SELECT', at });
  const handleMove = (from: Position, to: Position): void => dispatch({ type: 'MOVE', from, to });

  return (
    <div className="game-layout">
      <div>
        <div className="board-wrap">
          <Board
            board={viewGame.board}
            ply={viewPly}
            flipped={state.flipped}
            selected={state.selected}
            legalTargets={state.legalTargets}
            lastMove={lastHighlight}
            checkedGung={checkedGung}
            settings={state.settings}
            interactive={live}
            movableSide={live ? turn : null}
            onSelect={handleSelect}
            onMove={handleMove}
          />
        </div>

        <p className="visually-hidden" aria-live="polite">
          {announce}
        </p>

        {state.notice !== null && (
          <div className="error-box" style={{ marginTop: 10 }} role="alert">
            {state.notice}{' '}
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'DISMISS_NOTICE' })}>
              닫기
            </button>
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 10 }}>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'PASS' })}
            disabled={!passable}
            title={live && !passable ? '장군을 받은 상태에서는 쉴 수 없습니다' : '한 수 쉬기'}
          >
            한 수 쉬기
          </button>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={totalPlies === 0 || replaying}
          >
            무르기
          </button>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'OFFER_DRAW', side: turn })}
            disabled={!live}
          >
            무승부 제안
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm(`${SIDE_LABEL[turn]} 측이 기권합니다. 진행할까요?`)) {
                dispatch({ type: 'RESIGN', side: turn });
              }
            }}
            disabled={!live}
          >
            기권
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            새 대국
          </button>
        </div>

        <p className="empty-note" style={{ marginTop: 8 }}>
          기물을 눌러 고르고 표시된 지점을 누르면 이동합니다. 끌어서 놓아도 됩니다. 키보드는 보드에
          포커스를 준 뒤 방향키로 이동하고 Enter 로 선택합니다.
        </p>
      </div>

      <div className="sidebar">
        <TurnBanner turn={turn} inCheck={inCheck} settings={state.settings} replaying={replaying} />
        <ScorePanel
          scores={state.result.scores}
          settings={state.settings}
          hanBonus={state.game.config.hanBonus}
        />
        <GameStats
          startedAt={state.startedAt}
          endedAt={state.endedAt}
          plies={totalPlies}
          repetition={repetitionCount(viewGame)}
        />
        <CapturedPanel game={viewGame} settings={state.settings} />
        <MoveList
          moves={state.game.moveHistory}
          viewPly={viewPly}
          settings={state.settings}
          onGoto={(ply) => dispatch({ type: 'GOTO_PLY', ply })}
          onExport={onExport}
          onImport={onImport}
        />
        <SettingsPanel
          settings={state.settings}
          flipped={state.flipped}
          onChange={(patch) => dispatch({ type: 'SET_SETTINGS', settings: patch })}
          onToggleFlip={() => dispatch({ type: 'TOGGLE_FLIP' })}
        />
      </div>

      {state.drawOffer !== null && (
        <DrawOfferDialog
          from={state.drawOffer}
          onAccept={() => dispatch({ type: 'RESPOND_DRAW', accept: true })}
          onDecline={() => dispatch({ type: 'RESPOND_DRAW', accept: false })}
        />
      )}
    </div>
  );
}

function DrawOfferDialog({
  from,
  onAccept,
  onDecline,
}: {
  from: Side;
  onAccept: () => void;
  onDecline: () => void;
}): JSX.Element {
  return (
    <div className="backdrop" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="draw-title">
        <h2 id="draw-title">무승부 제안</h2>
        <p>
          {SIDE_LABEL[from]} 측이 무승부를 제안했습니다. {SIDE_LABEL[opponent(from)]} 측이 받아들이겠습니까?
          <br />
          받아들이면 규칙에 따라 점수가 높은 쪽이 승리합니다.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={onAccept}>
            받아들이기
          </button>
          <button className="btn" onClick={onDecline}>
            거절
          </button>
        </div>
      </div>
    </div>
  );
}
