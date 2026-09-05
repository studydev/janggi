import { Component } from 'react'
import type { ReactNode } from 'react'
import { Asterisk, Download, RotateCw } from 'lucide-react'
import { downloadJson } from './download'
import { MATCH_KEY } from './storage'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; message: string | null }> {
  state = { failed: false, message: null as string | null }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  backup = () => {
    try {
      const raw = window.localStorage.getItem(MATCH_KEY)
      if (!raw) { this.setState({ message: '백업 가능한 기보가 없습니다.' }); return }
      downloadJson(raw, 'astra-recovery-backup.json')
    } catch { this.setState({ message: '저장 공간에 접근할 수 없습니다.' }) }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="error-screen">
      <div className="error-content"><span className="brand-mark"><Asterisk aria-hidden="true" /></span><span className="eyebrow">ASTRA JANGGI</span>
        <h1>대국 화면에 오류가 발생했습니다</h1><p>기보는 삭제하지 않았습니다.</p>
        <div className="modal-actions"><button className="button secondary" type="button" onClick={this.backup}><Download size={17} aria-hidden="true" />기보 백업 받기</button>
          <button className="button primary" type="button" onClick={() => window.location.reload()}><RotateCw size={17} aria-hidden="true" />화면 다시 불러오기</button></div>
        {this.state.message && <p className="inline-error" role="alert">{this.state.message}</p>}
      </div>
    </main>
  }
}