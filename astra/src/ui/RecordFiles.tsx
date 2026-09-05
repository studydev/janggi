import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, FolderOpen } from 'lucide-react'
import { importGame, MAX_RECORD_BYTES } from '../engine/game-record'
import type { LoadedGame } from '../engine/game-record'
import { SIDE_NAMES } from '../engine/janggi-notation'
import { downloadJson } from './download'
import { useGame } from './game-context'
import { Modal } from './Modal'
import { serializeMatch } from './storage'

export function RecordFiles() {
  const { state, dispatch } = useGame()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ saved: LoadedGame; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setError(null)
    if (file.size > MAX_RECORD_BYTES) { setError('기보 파일은 2 MB 이하여야 합니다.'); return }
    setLoading(true)
    try { setPending({ saved: importGame(await file.text()), name: file.name }) }
    catch { setError('기보 형식 또는 착수가 올바르지 않습니다.') }
    finally { setLoading(false) }
  }

  function exportFile() {
    try { downloadJson(serializeMatch(state), `astra-${new Date().toISOString().slice(0, 10)}.json`); setError(null) }
    catch { setError('기보 파일을 만들 수 없습니다.') }
  }

  return <div className="record-files">
    <div className="file-actions">
      <button className="button file-button" type="button" aria-label="기보 JSON 내보내기" disabled={state.phase !== 'playing'} onClick={exportFile}><Download size={16} aria-hidden="true" />내보내기</button>
      <button className="button file-button" type="button" aria-label="기보 JSON 불러오기" disabled={loading} onClick={() => input.current?.click()}><FolderOpen size={16} aria-hidden="true" />{loading ? '불러오는 중' : '불러오기'}</button>
    </div>
    <input className="file-input" ref={input} type="file" accept="application/json,.json" aria-label="기보 파일 선택" onChange={readFile} />
    {error && <p className="inline-error" role="alert">{error}</p>}
    {pending && <Modal title="기보를 불러올까요?" onClose={() => setPending(null)}>
      <p className="file-name">{pending.name}</p><p className="modal-copy">{pending.saved.game.moveHistory.length}수 · {SIDE_NAMES[pending.saved.game.turn]} 차례</p>
      {state.phase === 'playing' && <p className="modal-copy">현재 대국이 이 기보로 교체됩니다.</p>}
      <div className="modal-actions"><button className="button secondary" type="button" onClick={() => setPending(null)}>취소</button>
        <button className="button primary" type="button" onClick={() => { dispatch({ type: 'LOAD', saved: pending.saved }); setPending(null) }}>기보 불러오기</button></div>
    </Modal>}
  </div>
}