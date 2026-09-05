import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, Clock3, Download, Flag, Handshake, Leaf, Pause, RotateCcw, Settings2, ShieldCheck, Upload, Users, X } from 'lucide-react';
import { calculateScore, createGame, generateLegalMoves, isCheck } from '../engine';
import type { GameState, Piece, Position, Setup, Side } from '../engine/types';
import { formatMove, pieceName, sideName } from '../engine/janggi-notation';
import { deserializeGame, MAX_RECORD_BYTES, replayAt, serializeGame, useGame } from '../game';
import Board from './Board';
import Modal from './Modal';

const SAVE_KEY = 'sudam.game.v1';
const PREF_KEY = 'sudam.preferences.v1';
const SETUPS: { value: Setup; name: string; pieces: string[]; description: string }[] = [
  { value: 'MASANGMASANG', name: '마상마상', pieces: ['馬', '象', '馬', '象'], description: '왼상차림' },
  { value: 'SANGMASANGMA', name: '상마상마', pieces: ['象', '馬', '象', '馬'], description: '오른상차림' },
  { value: 'MASANGSANGMA', name: '마상상마', pieces: ['馬', '象', '象', '馬'], description: '안상차림' },
  { value: 'SANGMAMASANG', name: '상마마상', pieces: ['象', '馬', '馬', '象'], description: '바깥상차림' },
];
type Dialog = 'settings' | 'rules' | 'resign' | 'draw' | 'new' | 'result' | 'import' | null;
interface Preferences { flipped: boolean; koreanLabels: boolean; accessibleColors: boolean }
function readStorage(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function readPreferences(): Preferences {
  try { const p = JSON.parse(readStorage(PREF_KEY) ?? '{}'); return { flipped: p.flipped === true, koreanLabels: p.koreanLabels === true, accessibleColors: p.accessibleColors === true }; }
  catch { return { flipped: false, koreanLabels: false, accessibleColors: false }; }
}
function clock(seconds: number) { return `${Math.floor(seconds / 3600) ? `${Math.floor(seconds / 3600)}:` : ''}${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function same(a: Position, b: Position) { return a.file === b.file && a.rank === b.rank; }
function PieceToken({ piece, korean }: { piece: Piece; korean: boolean }) {
  const labels = { CHA: '車', PO: '包', MA: '馬', SANG: '象', SA: '士', GUNG: piece.side === 'HAN' ? '漢' : '楚', JOL: piece.side === 'HAN' ? '兵' : '卒' };
  return <span className={`captured-token ${piece.side.toLowerCase()}`} title={`${sideName(piece.side)} ${pieceName(piece.type, piece.side)}`}>{korean ? pieceName(piece.type, piece.side).slice(0, 1) : labels[piece.type]}</span>;
}
function PlayerBar({ side, game, active, korean }: { side: Side; game: GameState; active: boolean; korean: boolean }) {
  const captured = game.capturedPieces.filter(p => p.side !== side);
  return <div className={`player-bar ${active ? 'active' : ''}`}>
    <span className={`side-seal ${side.toLowerCase()}`}>{side === 'HAN' ? '漢' : '楚'}</span>
    <div className="player-identity"><strong>{sideName(side)} <span>{side === 'CHO' ? '선수' : '후수'}</span></strong><span>{active ? '지금 둘 차례' : side === 'HAN' ? '덤 1.5점 포함' : '먼저 시작합니다'}</span></div>
    <div className="captured-pieces" aria-label={`${sideName(side)} 진영이 잡은 기물`}>{captured.map(p => <PieceToken key={p.id} piece={p} korean={korean} />)}</div>
    <div className="player-score"><strong>{calculateScore(game, side)}</strong><span>점</span></div>
  </div>;
}

export default function App() {
  const { state, dispatch } = useGame();
  const [hanSetup, setHanSetup] = useState<Setup>('MASANGMASANG');
  const [choSetup, setChoSetup] = useState<Setup>('MASANGMASANG');
  const [setupSide, setSetupSide] = useState<Side>('CHO');
  const [bikjang, setBikjang] = useState(true);
  const [repetitionCount, setRepetitionCount] = useState(3);
  const [preferences, setPreferences] = useState(readPreferences);
  const [selected, setSelected] = useState<Position | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [restoreData, setRestoreData] = useState<string | null>(() => readStorage(SAVE_KEY));
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<'preparing' | 'ready' | 'unavailable'>('preparing');
  const [sessionRevision, setSessionRevision] = useState(0);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof deserializeGame> | null>(null);
  const saveFailed = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const historyBottom = useRef<HTMLDivElement>(null);
  const lastResult = useRef<string | null>(null);
  const preview = useMemo(() => createGame(hanSetup, choSetup, { bikjang, repetitionCount }), [hanSetup, choSetup, bikjang, repetitionCount]);
  const game = state.game;
  const replaying = state.replayIndex !== null;
  const displayGame = useMemo(() => game ? replaying ? replayAt(game, state.replayIndex!) : game : preview, [game, replaying, state.replayIndex, preview]);
  const result = game?.result ?? null;
  const interactive = !!game && !result && !replaying && !dialog && !restoreData;
  const legalMoves = useMemo(() => interactive ? generateLegalMoves(displayGame) : [], [displayGame, interactive]);
  const legalTargets = useMemo(() => selected ? legalMoves.filter(m => same(m.from, selected)).map(m => m.to) : [], [legalMoves, selected]);
  const checkedSide = isCheck(displayGame, displayGame.turn) ? displayGame.turn : null;
  const lastMove = displayGame.moveHistory.at(-1) ?? null;

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let mounted = true;
    const failed = () => { if (mounted) setOfflineStatus('unavailable'); };
    navigator.serviceWorker.ready.then(() => { if (mounted) setOfflineStatus('ready'); }).catch(failed);
    window.addEventListener('sudam:offline-failed', failed);
    return () => { mounted = false; window.removeEventListener('sudam:offline-failed', failed); };
  }, []);
  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); } catch { /* Device preferences are optional. */ } }, [preferences]);
  useEffect(() => {
    if (!game || restoreData) return;
    try { localStorage.setItem(SAVE_KEY, serializeGame(game, state.elapsedSeconds)); setSaved(true); saveFailed.current = false; }
    catch { setSaved(false); if (!saveFailed.current) { setNotice('자동 저장 공간을 사용할 수 없습니다. 기보 저장 버튼으로 대국을 보관해 주세요.'); saveFailed.current = true; } }
  }, [game, state.elapsedSeconds, restoreData]);
  useEffect(() => {
    if (!game || result || replaying || restoreData) return;
    let last = Date.now();
    const timer = setInterval(() => { const now = Date.now(); const seconds = Math.floor((now - last) / 1000); if (seconds > 0) { dispatch({ type: 'TICK', seconds }); last += seconds * 1000; } }, 1000);
    return () => clearInterval(timer);
  }, [!!game, !!result, replaying, !!restoreData, dispatch, sessionRevision]);
  useEffect(() => { setSelected(null); }, [game, state.replayIndex, preferences.flipped]);
  useEffect(() => {
    if (!result || !game) { lastResult.current = null; return; }
    const key = `${result.status}:${result.winner}:${game.moveHistory.length}`;
    if (lastResult.current !== key) { setDialog('result'); lastResult.current = key; }
  }, [result, game]);
  useEffect(() => { historyBottom.current?.scrollIntoView({ block: 'nearest' }); }, [game?.moveHistory.length]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 5500); return () => clearTimeout(timer); }, [notice]);

  const select = useCallback((pos: Position) => {
    if (!interactive) return;
    if (selected) {
      const move = legalMoves.find(m => same(m.from, selected) && same(m.to, pos));
      if (move) { dispatch({ type: 'MOVE', move }); setSelected(null); return; }
    }
    const piece = displayGame.board[(pos.rank - 1) * 9 + pos.file - 1];
    setSelected(piece?.side === displayGame.turn && !(selected && same(selected, pos)) ? pos : null);
  }, [interactive, selected, legalMoves, displayGame, dispatch]);
  const start = () => { setSessionRevision(n => n + 1); dispatch({ type: 'START', hanSetup, choSetup, config: { bikjang, repetitionCount } }); setDialog(null); };
  const reset = () => { setSessionRevision(n => n + 1); dispatch({ type: 'RESET' }); setDialog(null); setSelected(null); setSaved(false); try { localStorage.removeItem(SAVE_KEY); } catch { setNotice('자동 저장 기록을 지우지 못했습니다. 브라우저의 저장 권한을 확인해 주세요.'); } };
  const exportGame = () => {
    if (!game) return;
    let text: string;
    try { text = serializeGame(game, state.elapsedSeconds); } catch (error) { setNotice(error instanceof Error ? error.message : '기보를 저장하지 못했습니다.'); return; }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `수담-기보-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('기보를 JSON 파일로 저장했습니다.');
  };
  const applyLoad = (restored: ReturnType<typeof deserializeGame>) => {
    lastResult.current = null; setDialog(null); setPendingImport(null); setSessionRevision(n => n + 1);
    dispatch({ type: 'LOAD', ...restored }); setRestoreData(null);
  };
  const importGame = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > MAX_RECORD_BYTES) throw new Error('기보 파일은 2MB 이하여야 합니다.');
      const restored = deserializeGame(await file.text());
      if (game) { setPendingImport(restored); setDialog('import'); }
      else { applyLoad(restored); setNotice('기보를 불러왔습니다. 기록에서 수를 눌러 복기할 수 있습니다.'); }
    } catch (error) { setNotice(error instanceof Error ? error.message : '기보를 불러올 수 없습니다.'); }
    if (fileInput.current) fileInput.current.value = '';
  };
  const discardRestore = () => { setRestoreData(null); try { localStorage.removeItem(SAVE_KEY); } catch { /* Ignore unavailable storage. */ } };
  const restore = () => {
    try { const restored = deserializeGame(restoreData!); applyLoad(restored); setNotice('이전 대국을 이어갑니다.'); }
    catch (error) { discardRestore(); setNotice(error instanceof Error ? error.message : '저장된 대국을 복구할 수 없습니다.'); }
  };
  const currentIndex = state.replayIndex ?? game?.moveHistory.length ?? 0;
  const topSide = preferences.flipped ? 'CHO' : 'HAN';
  const bottomSide = preferences.flipped ? 'HAN' : 'CHO';
  const currentSetup = setupSide === 'HAN' ? hanSetup : choSetup;

  return <div className={`app ${preferences.accessibleColors ? 'accessible-colors' : ''}`}>
    <header className="site-header"><a className="brand" href="./" onClick={e => { e.preventDefault(); if (game) setDialog('new'); }} aria-label="수담, 처음으로"><span className="brand-symbol">楚</span><span>수담<small>手談 · JANGGI</small></span></a><nav aria-label="주 메뉴"><span className="nav-active">대국실</span><button onClick={() => setDialog('rules')}>장기 안내 <ArrowRight size={14} /></button></nav><div className="header-actions"><span className="local-badge"><Users size={14} /> 로컬 2인</span><button className="icon-button" aria-label="화면 설정" onClick={() => setDialog('settings')}><Settings2 size={19} /></button></div></header>
    <main className="main-content">
      <section className="page-intro"><div><div className="eyebrow"><span /> A MOMENT, A MOVE</div><h1>마주 앉아, <em>한 수.</em></h1><p>말없이 나누는 대화, 우리들의 장기 한 판.</p></div><div className="intro-note"><Leaf size={18} /><span>서두르지 않아도 괜찮아요.<br />좋은 수는 여유에서 시작되니까요.</span></div></section>
      <div className="game-layout">
        <section className="board-section" aria-label="장기 대국판">
          <PlayerBar side={topSide} game={displayGame} active={!!game && !result && displayGame.turn === topSide} korean={preferences.koreanLabels} />
          <div className="board-frame"><Board board={displayGame.board} selected={selected} legalTargets={legalTargets} lastMove={lastMove} checkedSide={checkedSide} flipped={preferences.flipped} koreanLabels={preferences.koreanLabels} accessibleColors={preferences.accessibleColors} interactive={interactive} onSelect={select} onMove={(from, to) => { if (!interactive) return; const move = legalMoves.find(m => same(m.from, from) && same(m.to, to)); if (move) dispatch({ type: 'MOVE', move }); setSelected(null); }} /></div>
          <PlayerBar side={bottomSide} game={displayGame} active={!!game && !result && displayGame.turn === bottomSide} korean={preferences.koreanLabels} />
          <div className="board-caption"><span><span className="keycap">↵</span> 선택·이동 <span className="keycap">↑↓←→</span> 탐색</span><button onClick={() => setPreferences(p => ({ ...p, flipped: !p.flipped }))}><ArrowDownUp size={15} /> 장기판 뒤집기</button></div>
        </section>
        <aside className="side-panel">
          {!game ? <>
            <section className="setup-panel"><div className="panel-eyebrow">LET’S PLAY</div><h2>대국을 준비할까요?</h2><p className="panel-description">나만의 포진을 고르고<br />첫 수를 시작해 보세요.</p>
              <div className="mode-badge"><Users size={17} /><strong>둘이서 두기</strong><span>한 기기에서 함께</span></div>
              <div className="section-label"><span>마 · 상 배치</span><span>왼쪽 → 오른쪽</span></div>
              <div className="side-tabs" role="tablist" aria-label="배치할 진영"><button role="tab" aria-selected={setupSide === 'CHO'} className={setupSide === 'CHO' ? 'selected cho' : ''} onClick={() => setSetupSide('CHO')}>초 楚 <small>선수</small></button><button role="tab" aria-selected={setupSide === 'HAN'} className={setupSide === 'HAN' ? 'selected han' : ''} onClick={() => setSetupSide('HAN')}>한 漢 <small>후수</small></button></div>
              <div className="setup-options" role="group" aria-label={`${sideName(setupSide)} 마상 배치`}>{SETUPS.map(s => <button key={s.value} className={`setup-option ${currentSetup === s.value ? 'selected' : ''} ${setupSide.toLowerCase()}`} aria-pressed={currentSetup === s.value} aria-label={`${sideName(setupSide)} ${s.name}`} onClick={() => (setupSide === 'HAN' ? setHanSetup : setChoSetup)(s.value)}><span className="setup-pieces">{s.pieces.map((p, i) => <span key={i}>{preferences.koreanLabels ? p === '馬' ? '마' : '상' : p}</span>)}</span><span className="setup-name">{s.name}{currentSetup === s.value ? <Check size={13} /> : <span />}</span></button>)}</div>
              <div className="rule-options"><label className="switch-row"><span>빅장 점수 판정 <button type="button" className="help-button" aria-label="빅장 규칙 설명" onClick={() => setDialog('rules')}><CircleHelp size={14} /></button></span><input type="checkbox" aria-label="빅장 점수 판정" checked={bikjang} onChange={e => setBikjang(e.target.checked)} /><span className="switch" aria-hidden="true" /></label><label className="repetition-row">동일 국면 반복<select value={repetitionCount} onChange={e => setRepetitionCount(Number(e.target.value))}><option value={3}>3회</option><option value={4}>4회</option><option value={5}>5회</option></select></label></div>
              <button className="primary-button start-button" onClick={start}>대국 시작하기 <ArrowRight size={18} /></button><p className="setup-footnote">초(楚)가 먼저 둡니다.</p>
            </section>
            <div className="import-callout"><BookOpen size={21} /><div><strong>지난 대국을 다시 보고 싶다면</strong><button onClick={() => fileInput.current?.click()}>기보 불러오기 <ArrowUpRight /></button></div></div>
          </> : <>
            <section className={`turn-panel ${displayGame.turn.toLowerCase()}`} aria-live="polite"><div className="turn-panel-top"><span>{replaying ? 'REPLAY · 기보 복기' : result ? 'MATCH COMPLETE' : 'NOW PLAYING'}</span><span><Clock3 size={13} /> {clock(state.elapsedSeconds)}</span></div><h2>{replaying ? `${currentIndex}수째 돌아보기` : result ? `${result.winner ? sideName(result.winner) + ' 승리' : '무승부'}` : `${sideName(displayGame.turn)}의 차례입니다.`}</h2><p>{replaying ? '복기 중에는 착수할 수 없습니다.' : result ? result.reason : checkedSide ? '장군! 궁을 지키는 수를 두세요.' : selected ? '표시된 곳으로 기물을 옮겨 보세요.' : '기물을 선택해 다음 수를 두세요.'}</p>{replaying && <button className="return-live" onClick={() => dispatch({ type: 'REPLAY', index: null })}>대국으로 돌아가기 <ArrowRight size={14} /></button>}{result && !replaying && <button className="return-live" onClick={() => setDialog('result')}>대국 결과 보기 <ArrowRight size={14} /></button>}</section>
            <section className="history-panel"><div className="history-heading"><h3>대국 기록</h3><span>{game.moveHistory.length}수</span></div><div className="history-columns"><span>수</span><span>진영</span><span>기보</span></div><div className="history-list" role="log" aria-label="대국 기보">{game.moveHistory.length === 0 ? <div className="empty-history"><BookOpen size={28} strokeWidth={1.2} /><strong>첫 수를 기다리고 있어요.</strong><span>한 수, 한 수가 여기에 쌓입니다.</span></div> : game.moveHistory.map((record, i) => <button className={`history-row ${replaying && currentIndex === i + 1 ? 'current' : ''}`} key={i} onClick={() => dispatch({ type: 'REPLAY', index: i + 1 })} aria-label={`${i + 1}수 ${sideName(record.side)} ${formatMove(record)} 복기`}><span>{String(i + 1).padStart(2, '0')}</span><span className={`history-side ${record.side.toLowerCase()}`}>{sideName(record.side)}</span><span>{formatMove(record)}</span></button>)}<div ref={historyBottom} /></div><div className="replay-controls"><button aria-label="처음 국면" disabled={!game.moveHistory.length || currentIndex === 0} onClick={() => dispatch({ type: 'REPLAY', index: 0 })}><ChevronsLeft size={18} /></button><button aria-label="이전 수" disabled={currentIndex === 0} onClick={() => dispatch({ type: 'REPLAY', index: currentIndex - 1 })}><ChevronLeft size={18} /></button><span>{currentIndex} <i>/</i> {game.moveHistory.length}</span><button aria-label="다음 수" disabled={currentIndex >= game.moveHistory.length} onClick={() => dispatch({ type: 'REPLAY', index: currentIndex + 1 })}><ChevronRight size={18} /></button><button aria-label="마지막 국면" disabled={!game.moveHistory.length || (replaying && currentIndex === game.moveHistory.length)} onClick={() => dispatch({ type: 'REPLAY', index: game.moveHistory.length })}><ChevronsRight size={18} /></button></div></section>
            <section className="game-actions" aria-label="대국 조작"><button disabled={!interactive || !!checkedSide} onClick={() => dispatch({ type: 'PASS' })}><Pause size={17} /> 한 수 쉬기</button><button disabled={!game.moveHistory.length || replaying || !!dialog} onClick={() => dispatch({ type: 'UNDO' })}><RotateCcw size={17} /> 무르기</button><button disabled={!interactive} onClick={() => setDialog('draw')}><Handshake size={17} /> 무승부 제안</button><button disabled={!interactive} onClick={() => setDialog('resign')}><Flag size={16} /> 기권</button></section>
            <div className="record-actions"><button onClick={exportGame}><Download size={15} /> 기보 저장</button><button onClick={() => fileInput.current?.click()}><Upload size={15} /> 불러오기</button></div><button className="new-game-button" onClick={() => setDialog('new')}>새 대국 준비하기 <ArrowRight size={16} /></button><div className="save-status"><ShieldCheck size={13} />{saved ? '이 기기에 자동 저장 중' : '기보 파일로 대국을 보관하세요'}</div>
          </>}
          <div className="quiet-note"><span>手談</span><p>손으로 나누는 이야기.<br />승패보다 즐거운 한 판이 되기를.</p></div>
        </aside>
      </div>
      <footer className="site-footer"><span>수담 <i>·</i> 한국 장기의 멋을 잇다{import.meta.env.PROD && <small className="offline-status" role="status">{offlineStatus === 'ready' ? '오프라인 대국 준비 완료' : offlineStatus === 'preparing' ? '오프라인 대국 준비 중' : '오프라인 저장을 사용할 수 없습니다'}</small>}</span><button onClick={() => setDialog('rules')}><CircleHelp size={14} /> 장기 규칙 알아보기</button></footer>
    </main>
    <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={e => void importGame(e.target.files?.[0])} />
    {(notice || state.error) && <div className="toast" role="status"><span>{state.error || notice}</span><button aria-label="알림 닫기" onClick={() => { setNotice(null); dispatch({ type: 'CLEAR_ERROR' }); }}><X size={17} /></button></div>}
    {restoreData && <Modal title="두던 대국이 남아 있어요"><p>이 기기에 저장된 장기판과 기보를 불러와 이어서 둘 수 있습니다.</p><div className="modal-actions"><button className="secondary-button" onClick={discardRestore}>새로 시작</button><button className="primary-button" onClick={restore}>이어서 두기 <ArrowRight size={16} /></button></div></Modal>}
    {!restoreData && dialog === 'settings' && <Modal title="편안한 장기판" onClose={() => setDialog(null)}><p>보기 편한 방식으로 장기판을 바꿔 보세요.</p><div className="settings-list">{([{ key: 'koreanLabels', title: '한글 기물', description: '한자 대신 궁·차·포·마·상으로 표시' }, { key: 'accessibleColors', title: '색 구분을 더 선명하게', description: '초는 파랑, 한은 주황으로 표시' }, { key: 'flipped', title: '장기판 뒤집기', description: '한 진영을 화면 아래에 배치' }] as const).map(item => <label className="switch-row" key={item.key}><span><strong>{item.title}</strong><small>{item.description}</small></span><input type="checkbox" checked={preferences[item.key]} onChange={e => setPreferences(p => ({ ...p, [item.key]: e.target.checked }))} /><span className="switch" aria-hidden="true" /></label>)}</div><button className="primary-button full-width" onClick={() => setDialog(null)}>설정 완료</button></Modal>}
    {!restoreData && dialog === 'rules' && <Modal title="장기, 천천히 알아가기" onClose={() => setDialog(null)}><div className="rules-content"><p>9열 × 10행의 교차점에서 두는 한국 장기입니다. 초가 먼저 두며, 강은 없습니다.</p><dl><dt>궁 · 사</dt><dd>자기 궁성의 선을 따라 한 칸. X자 대각선도 이용합니다.</dd><dt>차</dt><dd>가로·세로로 곧게 이동합니다. 궁성에서는 그어진 대각선도 따라갑니다.</dd><dt>포</dt><dd>이동과 공격 모두 기물 하나를 꼭 넘습니다. 포를 넘거나 포를 잡을 수 없습니다.</dd><dt>마 · 상</dt><dd>마는 직선 한 칸 뒤 대각 한 칸, 상은 직선 한 칸 뒤 대각 두 칸. 중간 길이 막히면 갈 수 없습니다.</dd><dt>졸 · 병</dt><dd>앞·좌·우로 한 칸. 뒤로는 못 갑니다. 상대 궁성에서는 대각선으로 전진할 수 있습니다.</dd><dt>장군과 외통</dt><dd>궁이 공격받으면 반드시 피해야 합니다. 피할 수 있는 수가 없으면 외통패입니다. 장군 중에는 쉴 수 없습니다.</dd><dt>빅장 · 반복 · 합의</dt><dd>빅장 설정이 켜져 있을 때 양 궁이 같은 세로줄에서 바로 마주보거나, 같은 국면이 설정 횟수만큼 반복되거나, 양측이 무승부에 합의하면 남은 기물 점수로 승패를 정합니다.</dd></dl><div className="score-guide"><strong>차 13 · 포 7 · 마 5 · 상 3 · 사 3 · 졸/병 2</strong><p>궁은 0점. 한은 후수 덤 1.5점을 받습니다.<br />시작 점수는 초 72점, 한 73.5점입니다.</p></div><p className="muted">기물을 클릭하거나 끌어서 이동할 수 있습니다. 키보드에서는 방향키로 위치를 옮기고 Enter 또는 Space로 선택·착수하세요. AI와 온라인 대전은 추후 추가 예정입니다.</p></div></Modal>}
    {!restoreData && dialog === 'resign' && game && <Modal title={`${sideName(game.turn)} 진영이 기권할까요?`} onClose={() => setDialog(null)}><p>기권하면 상대 진영의 승리로 대국이 끝납니다. 기보는 계속 저장하거나 복기할 수 있습니다.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDialog(null)}>계속 두기</button><button className="danger-button" onClick={() => { dispatch({ type: 'RESIGN', side: game.turn }); setDialog(null); }}>기권하기</button></div></Modal>}
    {!restoreData && dialog === 'draw' && game && <Modal title="무승부를 제안합니다" onClose={() => setDialog(null)}><p>{sideName(game.turn === 'CHO' ? 'HAN' : 'CHO')} 진영이 수락하면 현재 기물 점수로 승패를 결정합니다. 초 {calculateScore(game, 'CHO')}점, 한 {calculateScore(game, 'HAN')}점입니다.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDialog(null)}>거절 · 계속 두기</button><button className="primary-button" onClick={() => { dispatch({ type: 'AGREE_DRAW' }); setDialog(null); }}>상대방 수락</button></div></Modal>}
    {!restoreData && dialog === 'import' && pendingImport && <Modal title="불러온 대국으로 바꿀까요?" onClose={() => { setDialog(null); setPendingImport(null); }}><p>현재 대국과 자동 저장 기록이 불러온 기보로 바뀝니다. 현재 대국을 남기려면 먼저 기보를 저장해 주세요.</p><div className="modal-actions"><button className="secondary-button" onClick={exportGame}><Download size={15} /> 현재 기보 저장</button><button className="primary-button" onClick={() => { applyLoad(pendingImport); setNotice('기보를 불러왔습니다.'); }}>불러온 대국 열기</button></div></Modal>}
    {!restoreData && dialog === 'new' && <Modal title="새로운 한 판을 준비할까요?" onClose={() => setDialog(null)}><p>현재 대국이 새 장기판으로 바뀝니다. 남기고 싶은 대국은 기보 파일로 저장해 주세요.</p><div className="modal-actions"><button className="secondary-button" onClick={exportGame}><Download size={15} /> 기보 저장</button><button className="primary-button" onClick={reset}>새 대국 준비</button></div></Modal>}
    {!restoreData && dialog === 'result' && result && game && <Modal title="한 판의 이야기가 완성됐어요" onClose={() => setDialog(null)}><div className="result-content"><span className={`result-seal ${result.winner?.toLowerCase() ?? ''}`}>{result.winner === 'CHO' ? '楚' : result.winner === 'HAN' ? '漢' : '和'}</span><h3>{result.winner ? `${sideName(result.winner)} 진영 승리` : '무승부'}</h3><p>{result.reason}</p><div className="result-scores"><span>초 <strong>{calculateScore(game, 'CHO')}</strong>점</span><span>한 <strong>{calculateScore(game, 'HAN')}</strong>점</span></div><p className="muted">{game.moveHistory.length}수 · {clock(state.elapsedSeconds)}</p></div><div className="modal-actions"><button className="secondary-button" onClick={() => { setDialog(null); dispatch({ type: 'REPLAY', index: 0 }); }}>기보 돌아보기</button><button className="primary-button" onClick={reset}>다시 한 판</button></div></Modal>}
  </div>;
}
function ArrowUpRight() { return <ArrowRight size={13} style={{ transform: 'rotate(-40deg)' }} />; }
