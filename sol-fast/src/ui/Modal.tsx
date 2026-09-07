import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  readonly open: boolean
  readonly title: string
  readonly children: ReactNode
  readonly footer: ReactNode
  readonly onClose?: () => void
  readonly urgent?: boolean
}

export function Modal({ open, title, children, footer, onClose, urgent = false }: ModalProps) {
  useEffect(() => {
    if (!open || !onClose) return
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role={urgent ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          {onClose && (
            <button className="icon-button" type="button" onClick={onClose} title="닫기">
              <X aria-hidden="true" />
              <span className="sr-only">닫기</span>
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-footer">{footer}</footer>
      </section>
    </div>
  )
}
