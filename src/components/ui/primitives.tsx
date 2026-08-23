import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect } from 'react'
import { clsx } from 'clsx'
import { scaleIn } from '../../utils/animations'
import { useLifeStore } from '../../store/useLifeStore'

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'icon' }) {
  return <button className={clsx('button ripple', `button-${variant}`, `button-${size}`, className)} {...props}>{children}</button>
}
export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={clsx('icon-button ripple', className)} aria-label={label} title={label} {...props}>{children}</button>
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={clsx('input', className)} {...props} /> }
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={clsx('input select', className)} {...props}>{children}</select> }
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={clsx('input textarea', className)} {...props} /> }
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={clsx('card', className)} {...props}>{children}</div> }
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; className?: string }) { return <span className={clsx('badge', `badge-${tone}`, className)}>{children}</span> }
export function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={clsx('toggle', checked && 'is-on')} onClick={() => !disabled && onChange(!checked)} disabled={disabled}><motion.span layout transition={{ type: 'spring', stiffness: 520, damping: 32 }}>{checked && <Check size={11} />}</motion.span></button>
}
export function Progress({ value, tone = 'default', label }: { value: number; tone?: 'default' | 'success' | 'warning' | 'danger'; label?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return <div className="progress" aria-label={label} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)}><motion.span className={`progress-${tone}`} initial={{ width: 0 }} animate={{ width: `${safe}%` }} transition={{ duration: .8, ease: 'easeOut' }} /></div>
}
export function RingProgress({ value, size = 104, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const radius = (size - stroke) / 2; const circumference = radius * 2 * Math.PI; const safe = Math.max(0, Math.min(100, value))
  return <div className="ring-progress" style={{ width: size, height: size }}>
    <svg width={size} height={size} aria-hidden="true"><circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} /><motion.circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - safe / 100) }} transition={{ duration: 1, ease: 'easeOut' }} /></svg>
    <div className="ring-content">{children ?? <strong>{Math.round(safe)}%</strong>}</div>
  </div>
}
export function Modal({ open, onClose, title, description, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const language = useLifeStore(state => state.settings.language)
  useEffect(() => { const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose(); if (open) document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key) }, [open, onClose])
  return <AnimatePresence>{open && <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <motion.section className={clsx('modal', `modal-${size}`)} role="dialog" aria-modal="true" aria-labelledby="modal-title" variants={scaleIn} initial="hidden" animate="visible" exit="exit">
      <header className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><IconButton label={language === 'en' ? 'Close' : 'Fermer'} onClick={onClose}><X size={18} /></IconButton></header>
      <div className="modal-body">{children}</div>
    </motion.section>
  </motion.div>}</AnimatePresence>
}
export function AnimatedNumber({ value, format = value => Math.round(value).toString() }: { value: number; format?: (value: number) => string }) {
  const motionValue = useMotionValue(0); const spring = useSpring(motionValue, { duration: 1300 });
  const [display, setDisplay] = React.useState(0)
  useEffect(() => { motionValue.set(value); return spring.on('change', latest => setDisplay(latest)) }, [value, motionValue, spring])
  return <>{format(display)}</>
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label> }
export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><strong>{title}</strong><p>{text}</p>{action}</div> }
export function ToastViewport() {
  const toasts = useLifeStore(state => state.toasts); const remove = useLifeStore(state => state.removeToast)
  return <div className="toast-viewport" aria-live="polite"><AnimatePresence>{toasts.map(toast => <motion.button key={toast.id} className={clsx('toast', `toast-${toast.tone ?? 'default'}`)} initial={{ opacity: 0, x: 80, scale: .96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }} onClick={() => remove(toast.id)}><span className="toast-dot" /><span><strong>{toast.title}</strong>{toast.message && <small>{toast.message}</small>}</span><X size={15} /></motion.button>)}</AnimatePresence></div>
}

// React is imported as a namespace only where useState is required by the animated counter.
import * as React from 'react'
