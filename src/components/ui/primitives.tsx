import { Check, X } from 'lucide-react'
import {
  forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes, useEffect, useRef, useState,
} from 'react'
import { clsx } from 'clsx'
import { useLifeStore } from '../../store/useLifeStore'

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'icon' }) {
  return <button className={clsx('button ripple', `button-${variant}`, `button-${size}`, className)} {...props}>{children}</button>
}
export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={clsx('icon-button ripple', className)} aria-label={label} title={label} {...props}>{children}</button>
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={clsx('input', className)} {...props} /> }
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={clsx('input select', className)} {...props}>{children}</select> }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) { return <textarea ref={ref} className={clsx('input textarea', className)} {...props} /> })
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={clsx('card', className)} {...props}>{children}</div> }
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; className?: string }) { return <span className={clsx('badge', `badge-${tone}`, className)}>{children}</span> }

export function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={clsx('toggle', checked && 'is-on')} onClick={() => !disabled && onChange(!checked)} disabled={disabled}><span>{checked && <Check size={11} />}</span></button>
}
export function Progress({ value, tone = 'default', label }: { value: number; tone?: 'default' | 'success' | 'warning' | 'danger'; label?: string }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return <div className="progress" aria-label={label} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)}><span className={`progress-${tone}`} style={{ width: `${safe}%` }} /></div>
}
export function RingProgress({ value, size = 104, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const radius = (size - stroke) / 2; const circumference = radius * 2 * Math.PI; const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return <div className="ring-progress" style={{ width: size, height: size }}>
    <svg width={size} height={size} aria-hidden="true"><circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} /><circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} strokeDasharray={circumference} style={{ strokeDashoffset: circumference * (1 - safe / 100) }} /></svg>
    <div className="ring-content">{children ?? <strong>{Math.round(safe)}%</strong>}</div>
  </div>
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const language = useLifeStore(state => state.settings.language)
  useEffect(() => {
    if (!open) return
    const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = previousOverflow }
  }, [open, onClose])
  if (!open) return null
  return <div className="modal-overlay modal-overlay-in" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={clsx('modal', 'modal-in', `modal-${size}`)} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><IconButton label={language === 'en' ? 'Close' : 'Fermer'} onClick={onClose}><X size={18} /></IconButton></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>
}

export function AnimatedNumber({ value, format = next => Math.round(next).toString() }: { value: number; format?: (value: number) => string }) {
  const [display, setDisplay] = useState(0)
  const latest = useRef(0)
  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')) {
      latest.current = target; setDisplay(target); return
    }
    const from = latest.current
    const started = performance.now()
    let frame = 0
    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / 850)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (target - from) * eased
      latest.current = next; setDisplay(next)
      if (progress < 1) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [value])
  return <>{format(display)}</>
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label> }
export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><strong>{title}</strong><p>{text}</p>{action}</div> }
export function ToastViewport() {
  const toasts = useLifeStore(state => state.toasts); const remove = useLifeStore(state => state.removeToast)
  return <div className="toast-viewport" aria-live="polite">{toasts.map(toast => <button key={toast.id} className={clsx('toast', 'toast-in', `toast-${toast.tone ?? 'default'}`)} onClick={() => remove(toast.id)}><span className="toast-dot" /><span><strong>{toast.title}</strong>{toast.message && <small>{toast.message}</small>}</span><X size={15} /></button>)}</div>
}
