import { useCallback, useEffect, useReducer, useState } from 'react';
import { createInitialAppState, gameReducer } from './state/gameReducer';
import type { Action } from './state/gameReducer';
import { clearAutosave, fromRecord, loadAutosave, saveAutosave } from './state/storage';
import type { GameRecord } from './state/storage';
import { GameScreen } from './ui/GameScreen';
import { SetupScreen } from './ui/SetupScreen';

export function App() {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, createInitialAppState);
  const [resume, setResume] = useState<GameRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dispatch = useCallback((action: Action) => {
    if (action.type === 'NEW_GAME') clearAutosave();
    rawDispatch(action);
  }, []);

  useEffect(() => {
    const record = loadAutosave();
    if (record && record.moves.length > 0) setResume(record);
  }, []);

  useEffect(() => {
    if (state.phase !== 'PLAYING') return;
    saveAutosave(state.game);
  }, [state.phase, state.game]);

  const handleResume = () => {
    if (!resume) return;
    try {
      dispatch({ type: 'RESUME', game: fromRecord(resume) });
      setResume(null);
      setNotice(null);
    } catch (error) {
      clearAutosave();
      setResume(null);
      setNotice(`저장된 대국을 복구하지 못했다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  if (state.phase === 'SETUP') {
    return (
      <SetupScreen
        labelMode={state.options.labelMode}
        notice={notice}
        resumeAvailable={resume !== null}
        onResume={handleResume}
        onDiscardResume={() => {
          clearAutosave();
          setResume(null);
        }}
        onStart={(hanSetup, choSetup, config) => dispatch({ type: 'START_GAME', hanSetup, choSetup, config })}
      />
    );
  }

  return <GameScreen state={state} dispatch={dispatch} />;
}
