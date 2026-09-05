import { useState } from 'react'
import { ArrowRight, Asterisk, Clock3, Eye, Flag, Handshake, Pause, Plus, RotateCw, Settings2, Trophy, Undo2, UsersRound } from 'lucide-react'
import { oppositeSide } from './engine/board'
import { RESULT_LABELS, SIDE_NAMES } from './engine/janggi-notation'
import { findGung, getLegalMovesFrom, isCheck } from './engine/rules'
import type { GameResult } from './engine/result'
import { Board } from './ui/Board'
import { GameProvider } from './ui/GameContext'
import { useGame } from './ui/game-context'
import { isLive, viewedGame } from './ui/game-state'
import { IconButton } from './ui/IconButton'
import { PlayerBar, RecordPanel } from './ui/MatchPanels'
import { Modal } from './ui/Modal'
import { RecordFiles } from './ui/RecordFiles'
import { SetupPanel } from './ui/SetupPanel'
import { downloadJson } from './ui/download'
import { PwaStatus } from './ui/PwaStatus'

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes >= 60 ? Math.floor(minutes / 60) + ':' : ''}${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function MatchActions({ onResign }: { onResign: () => void }) {
  const { state, dispatch } = useGame()
  const live = isLive(state)
  return <div className="match-actions" role="group" aria-label="대국 조작">
    <button className="button pass-button" type="button" disabled={!live || isCheck(state.game, state.game.turn)} onClick={() => dispatch({ type: 'PASS' })}><Pause size={16} aria-hidden="true" />한 수 쉬기</button>
    <IconButton label="한 수 무르기" icon={Undo2} disabled={state.cursor !== null || !!state.drawOffer || state.game.moveHistory.length === 0} onClick={() => dispatch({ type: 'UNDO' })} />
    <IconButton label="무승부 제안" icon={Handshake} disabled={!live} onClick={() => dispatch({ type: 'OFFER_DRAW' })} />
    <IconButton label="기권" icon={Flag} disabled={!live} onClick={onResign} />
  </div>
}

function DisplaySettings() {
  const { state, dispatch } = useGame()
  return <div className="display-settings">
    <fieldset><legend>기물 표기</legend><div className="segmented">
      {(['hanja', 'hangul'] as const).map((notation) => <label key={notation} className={state.preferences.notation === notation ? 'is-chosen' : ''}>
        <input type="radio" name="notation" value={notation} checked={state.preferences.notation === notation}
          onChange={() => dispatch({ type: 'PREFERENCES', preferences: { notation } })} /><span className="notation-symbol">{notation === 'hanja' ? '漢' : '한'}</span>{notation === 'hanja' ? '한자' : '한글'}
      </label>)}
    </div></fieldset>
    <fieldset><legend>장기판 방향</legend><div className="segmented">
      {[false, true].map((flipped) => <label key={String(flipped)} className={state.preferences.flipped === flipped ? 'is-chosen' : ''}>
        <input type="radio" name="orientation" checked={state.preferences.flipped === flipped}
          onChange={() => dispatch({ type: 'PREFERENCES', preferences: { flipped } })} />{flipped ? '한 아래' : '초 아래'}
      </label>)}
    </div></fieldset>
    <label className="toggle-row" htmlFor="accessible-palette"><span>색각 보조 팔레트<span className="palette-swatches" aria-hidden="true"><i /><i /></span></span>
      <input id="accessible-palette" className="switch" type="checkbox" checked={state.preferences.palette === 'accessible'}
        onChange={(event) => dispatch({ type: 'PREFERENCES', preferences: { palette: event.target.checked ? 'accessible' : 'classic' } })} />
    </label>
  </div>
}

function GameScreen() {
  const { state, dispatch, recovery, storageError, restoreSaved, discardSaved, dismissRecovery } = useGame()
  const [modal, setModal] = useState<'settings' | 'new' | 'resign' | null>(null)
  const [dismissedResult, setDismissedResult] = useState<GameResult | null>(null)
  const game = viewedGame(state)
  const live = isLive(state)
  const check = isCheck(game, game.turn)
  const legal = state.selected && live ? getLegalMovesFrom(game, state.selected) : []
  const topSide = state.preferences.flipped ? 'CHO' : 'HAN'
  const ended = state.result.status !== 'PLAYING'
  const replaying = state.cursor !== null
  const showResult = ended && !replaying && dismissedResult !== state.result

  function newMatch() {
    dispatch({ type: 'NEW' })
    setModal(null)
  }

  return <div className={`app-shell palette-${state.preferences.palette} ${state.phase === 'setup' ? 'is-preparing' : ''}`}>
    <a className="skip-link" href="#game-main">대국 화면으로 건너뛰기</a>
    <header className="site-header">
      <div className="brand"><span className="brand-mark"><Asterisk size={28} strokeWidth={1.2} aria-hidden="true" /></span><h1>Astra<span>장기</span></h1></div>
      <span className="header-mode"><UsersRound size={15} aria-hidden="true" />로컬 2인</span>
      <div className="header-actions"><button className="button secondary new-match" type="button" disabled={state.phase === 'setup'} onClick={() => setModal('new')}><Plus size={17} aria-hidden="true" />새 대국</button>
        <IconButton label="화면 설정" icon={Settings2} onClick={() => setModal('settings')} /></div>
    </header>

    <main id="game-main" className="game-main" tabIndex={-1}>
      <div className="workspace-heading"><div><span className="eyebrow">KOREAN CHESS</span><h2>대국실 <span className={`status-pill ${check && state.phase === 'playing' ? 'is-check' : ''}`}>
        {state.phase === 'setup' ? '대국 준비' : replaying ? '기보 재생' : ended ? '대국 종료' : check ? '장군' : '대국 중'}</span></h2></div>
        <div className="game-clock" aria-label={`경과 시간 ${formatTime(state.elapsedMs)}`}><Clock3 size={16} aria-hidden="true" /><span>{formatTime(state.elapsedMs)}</span></div>
      </div>
      <div className="game-layout">
        <section className="board-column" aria-label="대국 장기판">
          <PlayerBar side={topSide} game={game} active={state.phase === 'playing' && !ended && game.turn === topSide} />
          <div className={`board-wrap ${replaying ? 'is-replaying' : ''}`}>
            <Board board={game.board} selected={live ? state.selected : null} targets={legal.map((move) => ({ position: move.to, capture: !!move.captured }))}
              lastMove={game.moveHistory.at(-1) ?? null} checkedKing={check ? findGung(game.board, game.turn) : null}
              flipped={state.preferences.flipped} notation={state.preferences.notation} interactive={live}
              onSelect={(position) => dispatch({ type: 'SELECT', position })} onMove={(from, to) => dispatch({ type: 'MOVE', from, to })} onClear={() => dispatch({ type: 'CLEAR' })} />
          </div>
          <PlayerBar side={oppositeSide(topSide)} game={game} active={state.phase === 'playing' && !ended && game.turn === oppositeSide(topSide)} />
          {state.phase === 'playing' && <div className="mobile-match-controls"><MatchActions onResign={() => setModal('resign')} /></div>}
          <div className="board-tools"><span className="board-perspective">{state.preferences.flipped ? '漢 · 한 아래' : '楚 · 초 아래'}</span>
            <div className="tool-group"><IconButton label="장기판 뒤집기" icon={RotateCw} aria-pressed={state.preferences.flipped}
              onClick={() => dispatch({ type: 'PREFERENCES', preferences: { flipped: !state.preferences.flipped } })} />
              <IconButton label="기물 표시 설정" icon={Settings2} onClick={() => setModal('settings')} /></div></div>
        </section>

        <aside className="match-sidebar" aria-label="대국 관리">
          {state.phase === 'setup' ? <SetupPanel /> : <>
            <div className="panel-heading"><div><span className="eyebrow">{replaying ? 'REPLAY' : ended ? 'FINAL' : 'LIVE MATCH'}</span><h2>{replaying ? '기보 재생' : ended ? '대국 종료' : '대국 진행'}</h2></div>
              {replaying ? <Eye size={24} strokeWidth={1.4} aria-hidden="true" /> : <UsersRound size={24} strokeWidth={1.4} aria-hidden="true" />}</div>
            <div className={`turn-summary side--${game.turn}`}><span className="turn-symbol" aria-hidden="true">{game.turn === 'CHO' ? '楚' : '漢'}</span>
              <div><h3>{replaying ? `${state.cursor}수 국면` : ended ? `${state.result.winner ? SIDE_NAMES[state.result.winner] + ' 승리' : '무승부'}` : `${SIDE_NAMES[game.turn]}의 차례`}</h3>
                <p>{replaying ? '기보 재생 중' : ended ? RESULT_LABELS[state.result.reason] : check ? '장군' : `${game.moveHistory.length + 1}번째 수`}</p></div></div>
            <div className="desktop-match-controls"><MatchActions onResign={() => setModal('resign')} /></div>
            <RecordPanel />
            <dl className="match-rules"><div><dt>빅장 점수제</dt><dd>{game.config.bikjangEnabled ? '사용' : '미사용'}</dd></div><div><dt>반복 국면</dt><dd>{game.config.repetitionCount}회</dd></div></dl>
          </>}
          <RecordFiles />
          {storageError && <p className="inline-error" role="alert">{storageError}</p>}
          <div className="sidebar-signature"><Asterisk size={17} strokeWidth={1.1} aria-hidden="true" /><span>ASTRA JANGGI</span></div>
        </aside>
      </div>
    </main>
    <footer className="site-footer"><span>Astra</span><PwaStatus /><span>將棋 <span className="footer-dot">·</span> 9 × 10</span></footer>
    {state.phase === 'setup' && <div className="mobile-start"><IconButton label="마상 배치 설정으로 이동" icon={Settings2} onClick={() => document.getElementById('match-setup')?.scrollIntoView({ block: 'start' })} />
      <span>로컬 2인</span><button className="button primary" type="button" aria-label="바로 대국 시작" onClick={() => dispatch({ type: 'START' })}>대국 시작<ArrowRight size={17} aria-hidden="true" /></button></div>}
    <div className="sr-only" role="status" aria-live="polite">{state.announcement}</div>

    {recovery.kind === 'saved' && <Modal title="이전 대국을 이어둘까요?" onClose={dismissRecovery}>
      <p className="modal-copy">{recovery.saved.game.moveHistory.length}수 · {SIDE_NAMES[recovery.saved.game.turn]} 차례 · {formatTime(recovery.saved.elapsedMs)}</p>
      <div className="modal-actions"><button className="button secondary" type="button" onClick={discardSaved}>새로 시작</button><button className="button primary" type="button" onClick={restoreSaved}>이어서 두기</button></div>
    </Modal>}
    {recovery.kind === 'invalid' && <Modal title="저장된 대국을 복구할 수 없습니다" onClose={dismissRecovery}>
      <p className="modal-copy">저장 데이터의 형식이나 착수가 올바르지 않습니다.</p>
      <div className="modal-actions"><button className="button secondary" type="button" onClick={() => downloadJson(recovery.raw, 'astra-recovery-backup.json')}>원본 백업 받기</button><button className="button primary" type="button" onClick={discardSaved}>새로 시작</button></div>
    </Modal>}
    {modal === 'settings' && <Modal title="화면 설정" onClose={() => setModal(null)}><DisplaySettings /><div className="modal-actions"><button className="button primary" type="button" onClick={() => setModal(null)}>완료</button></div></Modal>}
    {modal === 'new' && <Modal title="새 대국을 시작할까요?" onClose={() => setModal(null)}><p className="modal-copy">현재 대국은 종료됩니다.</p>
      <div className="modal-actions"><button className="button secondary" type="button" onClick={() => setModal(null)}>취소</button><button className="button primary" type="button" onClick={newMatch}>새 대국</button></div></Modal>}
    {modal === 'resign' && <Modal title={`${SIDE_NAMES[game.turn]} 진영이 기권할까요?`} onClose={() => setModal(null)}><p className="modal-copy">{SIDE_NAMES[oppositeSide(game.turn)]} 진영의 승리로 대국을 마칩니다.</p>
      <div className="modal-actions"><button className="button secondary" type="button" onClick={() => setModal(null)}>계속 두기</button><button className="button danger" type="button" onClick={() => { dispatch({ type: 'RESIGN' }); setModal(null) }}>기권 확정</button></div></Modal>}
    {state.drawOffer && <Modal title={`${SIDE_NAMES[oppositeSide(state.drawOffer)]} 진영의 응답`} onClose={() => dispatch({ type: 'DRAW_RESPONSE', accept: false })}>
      <p className="modal-copy">{SIDE_NAMES[state.drawOffer]} 진영이 무승부를 제안했습니다. 수락하면 현재 점수로 승자를 정합니다.</p>
      <div className="offer-scores"><span>초 <strong>{state.result.scores.CHO}</strong></span><span>한 <strong>{state.result.scores.HAN}</strong></span></div>
      <div className="modal-actions"><button className="button secondary" type="button" onClick={() => dispatch({ type: 'DRAW_RESPONSE', accept: false })}>거절</button><button className="button primary" type="button" onClick={() => dispatch({ type: 'DRAW_RESPONSE', accept: true })}>수락 · 점수 판정</button></div>
    </Modal>}
    {showResult && <Modal title="대국 종료" onClose={() => setDismissedResult(state.result)}>
      <div className="result-content"><Trophy size={30} strokeWidth={1.2} aria-hidden="true" /><h3>{state.result.winner ? `${SIDE_NAMES[state.result.winner]} 진영 승리` : '무승부'}</h3><p>{RESULT_LABELS[state.result.reason]}</p></div>
      <div className="result-scores"><div className="side--CHO"><span>초 楚</span><strong>{state.result.scores.CHO}<small>점</small></strong></div><div className="side--HAN"><span>한 漢</span><strong>{state.result.scores.HAN}<small>점</small></strong></div></div>
      <div className="modal-actions"><button className="button secondary" type="button" onClick={() => { dispatch({ type: 'REPLAY', cursor: game.moveHistory.length }); setModal(null) }}>기보 보기</button><button className="button primary" type="button" onClick={newMatch}>새 대국</button></div>
    </Modal>}
  </div>
}

export default function App() {
  return <GameProvider><GameScreen /></GameProvider>
}
