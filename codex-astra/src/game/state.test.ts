import { describe, expect, it } from 'vitest';
import { gameReducer, initialAppState } from './state';

const firstMove = { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } };

describe('대국 상태', () => {
  it('시작 후 착수하고 무르면 원래 대국으로 돌아온다', () => {
    const started = gameReducer(initialAppState, { type: 'START' });
    const moved = gameReducer(started, { type: 'MOVE', move: firstMove });
    expect(moved.game?.moveHistory).toHaveLength(1);
    expect(gameReducer(moved, { type: 'UNDO' }).game).toEqual(started.game);
  });

  it('기보 재생 중 착수와 대국 조작을 막고 타이머를 멈춘다', () => {
    const started = gameReducer(initialAppState, { type: 'START' });
    const replay = gameReducer(started, { type: 'REPLAY', index: 0 });
    for (const action of [
      { type: 'MOVE', move: firstMove }, { type: 'PASS' }, { type: 'UNDO' },
      { type: 'RESIGN', side: 'CHO' }, { type: 'AGREE_DRAW' },
    ] as const) {
      expect(gameReducer(replay, action).game).toBe(started.game);
    }
    expect(gameReducer(replay, { type: 'TICK' }).elapsedSeconds).toBe(0);
    const live = gameReducer(replay, { type: 'REPLAY', index: null });
    expect(gameReducer(live, { type: 'TICK' }).elapsedSeconds).toBe(1);
  });

  it('종료되거나 시작하지 않은 대국의 타이머를 멈춘다', () => {
    expect(gameReducer(initialAppState, { type: 'TICK' })).toBe(initialAppState);
    const started = gameReducer(initialAppState, { type: 'START' });
    const ended = gameReducer(started, { type: 'RESIGN', side: 'CHO' });
    expect(gameReducer(ended, { type: 'TICK' }).elapsedSeconds).toBe(0);
  });

  it('화면 비활성화 후 지난 실제 시간을 반영하고 음수나 무한값을 무시한다', () => {
    const started = gameReducer(initialAppState, { type: 'START' });
    const elapsed = gameReducer(started, { type: 'TICK', seconds: 60 });
    expect(elapsed.elapsedSeconds).toBe(60);
    expect(gameReducer(elapsed, { type: 'TICK', seconds: -30 }).elapsedSeconds).toBe(60);
    expect(gameReducer(elapsed, { type: 'TICK', seconds: Infinity }).elapsedSeconds).toBe(60);
  });

  it('불법수에서 대국을 보존하고 읽을 수 있는 오류를 제공한다', () => {
    const started = gameReducer(initialAppState, { type: 'START' });
    const invalid = gameReducer(started, {
      type: 'MOVE', move: { from: { file: 1, rank: 7 }, to: { file: 1, rank: 5 } },
    });
    expect(invalid.game).toBe(started.game);
    expect(invalid.error).toBeTruthy();
    expect(gameReducer(invalid, { type: 'CLEAR_ERROR' }).error).toBeNull();
  });

  it('불러오기와 새 대국은 재생을 끝내고 올바른 시간을 설정한다', () => {
    const started = gameReducer(initialAppState, { type: 'START' });
    const replay = gameReducer(started, { type: 'REPLAY', index: 500 });
    expect(replay.replayIndex).toBe(0);
    const loaded = gameReducer(replay, { type: 'LOAD', game: started.game!, elapsedSeconds: 50 });
    expect(loaded.replayIndex).toBeNull();
    expect(loaded.elapsedSeconds).toBe(50);
    expect(gameReducer(loaded, { type: 'START' }).elapsedSeconds).toBe(0);
    expect(gameReducer(loaded, { type: 'RESET' })).toEqual(initialAppState);
  });
});
