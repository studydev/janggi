import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose?.(); }} onClick={e => { if (e.target === ref.current) onClose?.(); }}>
    <div className="modal-heading"><h2 id="modal-title">{title}</h2>{onClose && <button className="icon-button" aria-label="닫기" onClick={onClose}><X size={20} /></button>}</div>
    {children}
  </dialog>;
}
