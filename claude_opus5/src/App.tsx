/**
 * 앱 진입 컴포넌트. 화면 전환, 자동 저장, 기보 파일 입출력을 묶는다.
 * 규칙 판단은 전부 gameReducer -> engine 을 통해서만 일어난다.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { toRecord } from './engine/record';
import { GameOverDialog } from './ui/components/GameOverDialog';
import { GameScreen } from './ui/components/GameScreen';
import { SetupScreen } from './ui/components/SetupScreen';
import { gameReducer, initialAppState } from './ui/state/gameReducer';
import {
  clearAutosave,
  downloadRecord,
  loadAutosave,
  loadSettings,
  readRecordFile,
  saveAutosave,
  saveSettings,
} from './ui/state/storage';

export function App(): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, initialAppState);
  const [dialogDismissed, setDialogDismissed] = useState(false);
  const bootstrapped = useRef(false);

  /* 최초 1회: 설정 복원 + 진행 중이던 대국 복구 제안 */
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    dispatch({ type: 'SET_SETTINGS', settings: loadSettings() });
    const saved = loadAutosave();
    if (saved !== null) dispatch({ type: 'OFFER_RESTORE', record: saved });
  }, []);

  /* 설정 저장 */
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  /* 진행 중인 대국 자동 저장 */
  useEffect(() => {
    if (state.phase === 'SETUP') return;
    if (state.game.moveHistory.length === 0) return;
    saveAutosave(toRecord(state.game));
  }, [state.phase, state.game]);

  /* 종료되면 자동 저장을 지운다 — 다음 방문에서 끝난 대국을 되묻지 않도록 */
  useEffect(() => {
    if (state.phase === 'FINISHED') clearAutosave();
  }, [state.phase]);

  useEffect(() => {
    setDialogDismissed(false);
  }, [state.result]);

  const handleExport = useCallback(() => {
    downloadRecord(toRecord(state.game));
  }, [state.game]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const record = await readRecordFile(file);
      dispatch({ type: 'LOAD_RECORD', record });
    } catch (error) {
      window.alert(`기보를 읽지 못했습니다: ${(error as Error).message}`);
    }
  }, []);

  const showOverDialog = state.phase === 'FINISHED' && !dialogDismissed;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          장기 <small>將棋 · Korean Chess</small>
        </h1>
        {state.phase !== 'SETUP' && (
          <span className="empty-note">
            {state.game.setup.CHO === state.game.setup.HAN
              ? '양쪽 같은 배치'
              : '서로 다른 마·상 배치'}
          </span>
        )}
      </header>

      {state.restoreOffer !== null && (
        <div className="banner" role="region" aria-label="이전 대국 복구">
          <span>
            저장된 대국이 있습니다 ({state.restoreOffer.moves.length}수). 이어서 두시겠습니까?
          </span>
          <span className="btn-row">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => dispatch({ type: 'LOAD_RECORD', record: state.restoreOffer! })}
            >
              이어두기
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                clearAutosave();
                dispatch({ type: 'DISMISS_RESTORE' });
              }}
            >
              새로 시작
            </button>
          </span>
        </div>
      )}

      {state.phase === 'SETUP' ? (
        <SetupScreen
          setup={state.setup}
          config={state.config}
          onSetup={(side, setup) => dispatch({ type: 'SET_SETUP', side, setup })}
          onConfig={(config) => dispatch({ type: 'SET_CONFIG', config })}
          onStart={() => dispatch({ type: 'START' })}
          onImport={handleImport}
        />
      ) : (
        <GameScreen
          state={state}
          dispatch={dispatch}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}

      {showOverDialog && (
        <GameOverDialog
          result={state.result}
          onNewGame={() => dispatch({ type: 'NEW_GAME' })}
          onReview={() => setDialogDismissed(true)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
