/**
 * 화면 상태 전이. 규칙 자체는 엔진 테스트가 담당하고, 여기서는
 * 「UI 가 엔진 결과를 제대로 반영하는가」만 본다.
 */
import { describe, expect, it } from 'vitest';
import { pieceAt } from '../../engine/board';
import { toRecord } from '../../engine/record';
import { gameReducer, initialAppState, type Action, type AppState } from '../state/gameReducer';

function run(state: AppState, ...actions: Action[]): AppState {
  return actions.reduce(gameReducer, state);
}

const started = run(initialAppState, { type: 'START' });

describe('대국 시작', () => {
  it('설정 화면에서 시작하면 초가 선수다', () => {
    expect(started.phase).toBe('PLAYING');
    expect(started.game.turn).toBe('CHO');
    expect(started.game.moveHistory).toHaveLength(0);
  });

  it('마·상 배치 선택이 초기 보드에 반영된다', () => {
    const s = run(initialAppState, { type: 'SET_SETUP', side: 'CHO', setup: 'SMSM' }, { type: 'START' });
    expect(pieceAt(s.game.board, { file: 2, rank: 10 })?.type).toBe('SANG');
    expect(pieceAt(s.game.board, { file: 3, rank: 10 })?.type).toBe('MA');
  });
});

describe('선택과 착수', () => {
  it('자기 기물을 고르면 갈 수 있는 지점이 채워진다', () => {
    const s = run(started, { type: 'SELECT', at: { file: 5, rank: 7 } });
    expect(s.selected).toEqual({ file: 5, rank: 7 });
    expect(s.legalTargets).toHaveLength(3); // 전진 + 좌 + 우
  });

  it('상대 기물은 고를 수 없다', () => {
    const s = run(started, { type: 'SELECT', at: { file: 5, rank: 4 } });
    expect(s.selected).toBeNull();
    expect(s.legalTargets).toHaveLength(0);
  });

  it('같은 기물을 다시 누르면 선택이 풀린다', () => {
    const s = run(
      started,
      { type: 'SELECT', at: { file: 5, rank: 7 } },
      { type: 'SELECT', at: { file: 5, rank: 7 } },
    );
    expect(s.selected).toBeNull();
  });

  it('갈 수 있는 지점을 누르면 이동하고 차례가 넘어간다', () => {
    const s = run(
      started,
      { type: 'SELECT', at: { file: 5, rank: 7 } },
      { type: 'SELECT', at: { file: 5, rank: 6 } },
    );
    expect(s.game.turn).toBe('HAN');
    expect(s.game.moveHistory).toHaveLength(1);
    expect(s.selected).toBeNull();
    expect(pieceAt(s.game.board, { file: 5, rank: 6 })?.type).toBe('JOL');
  });

  it('드래그로 들어온 불법 수는 알림만 남기고 상태를 바꾸지 않는다', () => {
    const s = run(started, { type: 'MOVE', from: { file: 5, rank: 7 }, to: { file: 5, rank: 4 } });
    expect(s.game.moveHistory).toHaveLength(0);
    expect(s.notice).not.toBeNull();
  });

  it('초기 국면의 포는 고를 수는 있어도 갈 곳이 없다', () => {
    const s = run(started, { type: 'SELECT', at: { file: 2, rank: 8 } });
    expect(s.selected).toEqual({ file: 2, rank: 8 });
    expect(s.legalTargets).toHaveLength(0);
  });
});

describe('한 수 쉬기와 무르기', () => {
  it('쉬면 보드는 그대로고 차례만 넘어간다', () => {
    const s = run(started, { type: 'PASS' });
    expect(s.game.board).toBe(started.game.board);
    expect(s.game.turn).toBe('HAN');
    expect(s.game.moveHistory.at(-1)?.isPass).toBe(true);
  });

  it('무르기는 직전 한 수를 되돌린다', () => {
    const moved = run(
      started,
      { type: 'SELECT', at: { file: 5, rank: 7 } },
      { type: 'SELECT', at: { file: 5, rank: 6 } },
    );
    const back = run(moved, { type: 'UNDO' });
    expect(back.game.turn).toBe('CHO');
    expect(back.game.moveHistory).toHaveLength(0);
    expect(back.game.board).toEqual(started.game.board);
  });
});

describe('리플레이', () => {
  const played = run(
    started,
    { type: 'SELECT', at: { file: 5, rank: 7 } },
    { type: 'SELECT', at: { file: 5, rank: 6 } },
    { type: 'SELECT', at: { file: 2, rank: 1 } },
    { type: 'SELECT', at: { file: 3, rank: 3 } },
  );

  it('과거 시점으로 이동하면 replayPly 가 설정된다', () => {
    const s = run(played, { type: 'GOTO_PLY', ply: 1 });
    expect(s.replayPly).toBe(1);
  });

  it('리플레이 중에는 착수가 막힌다', () => {
    const s = run(
      played,
      { type: 'GOTO_PLY', ply: 0 },
      { type: 'SELECT', at: { file: 3, rank: 7 } },
      { type: 'MOVE', from: { file: 3, rank: 7 }, to: { file: 3, rank: 6 } },
    );
    expect(s.game.moveHistory).toHaveLength(2);
    expect(s.selected).toBeNull();
  });

  it('마지막 시점으로 돌아오면 다시 둘 수 있다', () => {
    const s = run(played, { type: 'GOTO_PLY', ply: 0 }, { type: 'GOTO_PLY', ply: 2 });
    expect(s.replayPly).toBeNull();
  });
});

describe('종료 처리', () => {
  it('기권하면 상대가 이긴다', () => {
    const s = run(started, { type: 'RESIGN', side: 'CHO' });
    expect(s.phase).toBe('FINISHED');
    expect(s.result.winner).toBe('HAN');
    expect(s.result.reason).toBe('RESIGNATION');
  });

  it('무승부 합의는 점수가 높은 쪽의 승리로 정리된다', () => {
    const s = run(started, { type: 'OFFER_DRAW', side: 'CHO' }, { type: 'RESPOND_DRAW', accept: true });
    expect(s.phase).toBe('FINISHED');
    expect(s.result.reason).toBe('AGREEMENT');
    expect(s.result.winner).toBe('HAN'); // 초기 국면에서는 덤 1.5 로 한이 앞선다
  });

  it('무승부 거절은 대국을 계속한다', () => {
    const s = run(started, { type: 'OFFER_DRAW', side: 'CHO' }, { type: 'RESPOND_DRAW', accept: false });
    expect(s.phase).toBe('PLAYING');
    expect(s.drawOffer).toBeNull();
  });
});

describe('기보 불러오기', () => {
  it('저장한 기보를 그대로 이어받는다', () => {
    const played = run(
      started,
      { type: 'SELECT', at: { file: 5, rank: 7 } },
      { type: 'SELECT', at: { file: 5, rank: 6 } },
    );
    const s = run(initialAppState, { type: 'LOAD_RECORD', record: toRecord(played.game) });
    expect(s.phase).toBe('PLAYING');
    expect(s.game.moveHistory).toHaveLength(1);
    expect(s.game.board).toEqual(played.game.board);
  });
});
