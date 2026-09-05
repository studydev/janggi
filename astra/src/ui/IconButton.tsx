import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: LucideIcon
}

export function IconButton({ label, icon: Icon, className = '', ...props }: IconButtonProps) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
    <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
    <span className="tooltip" aria-hidden="true">{label}</span>
  </button>
}