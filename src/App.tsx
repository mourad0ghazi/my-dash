import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react'
import type { PageId } from './types'
import { useLifeStore } from './store/useLifeStore'
import { AppShell } from './components/layout/AppShell'
import { Button, Input, ToastViewport } from './components/ui/primitives'

const DashboardPage = lazy(() => import('./components/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const FinancePage = lazy(() => import('./components/pages/FinancePage').then(module => ({ default: module.FinancePage })))
const FinanceSettingsPage = lazy(() => import('./components/pages/FinanceSettingsPage').then(module => ({ default: module.FinanceSettingsPage })))
const PersonalPage = lazy(() => import('./components/pages/PersonalPage').then(module => ({ default: module.PersonalPage })))
const FeaturesPage = lazy(() => import('./components/pages/FeaturesPage').then(module => ({ default: module.FeaturesPage })))
const SettingsPage = lazy(() => import('./components/pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const Chatbot = lazy(() => import('./components/chatbot/Chatbot').then(module => ({ default: module.Chatbot })))

const getPage = (): PageId => {
  const value = window.location.hash.replace('#/', '').split('?')[0]
  const root = value.split('/')[0]
  if (root === 'finances' || root === 'finance-settings' || root === 'personal' || root === 'features' || root === 'settings') return root
  if (root === 'premium') return 'features'
  return 'dashboard'
}
export default function App() {
  const [page, setPage] = useState<PageId>(getPage); const [booting, setBooting] = useState(() => !useLifeStore.persist.hasHydrated()); const [locked, setLocked] = useState(false); const [pin, setPin] = useState(''); const [pinError, setPinError] = useState(false); const [assistantReady, setAssistantReady] = useState(false)
  const settings = useLifeStore(state => state.settings); const updateSettings = useLifeStore(state => state.updateSettings); const addTask = useLifeStore(state => state.addTask); const addNote = useLifeStore(state => state.addNote); const setChatOpen = useLifeStore(state => state.setChatOpen); const chatOpen = useLifeStore(state => state.chatOpen); const en = settings.language === 'en'
  useEffect(() => { const onHash = () => setPage(getPage()); window.addEventListener('hashchange', onHash); if (!window.location.hash) window.location.hash = '#/'; const hydrated = useLifeStore.persist.onFinishHydration(() => setBooting(false)); if (useLifeStore.persist.hasHydrated()) setBooting(false); const bootFallback = window.setTimeout(() => setBooting(false), 1500); const onLock = () => setLocked(true); window.addEventListener('lifeos:lock', onLock); const serviceWorkerTimer = window.setTimeout(() => { if (!('serviceWorker' in navigator)) return; if (import.meta.env.PROD) navigator.serviceWorker.register('sw.js').catch(() => undefined); else navigator.serviceWorker.getRegistrations().then(items => Promise.all(items.filter(item => [item.active, item.waiting, item.installing].some(worker => worker?.scriptURL.endsWith('/sw.js'))).map(item => item.unregister()))).catch(() => undefined) }, 2500); return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('lifeos:lock', onLock); hydrated(); window.clearTimeout(bootFallback); window.clearTimeout(serviceWorkerTimer) } }, [])
  useEffect(() => {
    if (chatOpen) { setAssistantReady(true); return }
    let idle: number | undefined
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const timer = window.setTimeout(() => {
      const reveal = () => setAssistantReady(true)
      idle = typeof idleWindow.requestIdleCallback === 'function' ? idleWindow.requestIdleCallback(reveal, { timeout: 2500 }) : window.setTimeout(reveal, 0)
    }, 1600)
    return () => {
      window.clearTimeout(timer)
      if (idle !== undefined) {
        if (typeof idleWindow.cancelIdleCallback === 'function') idleWindow.cancelIdleCallback(idle)
        else window.clearTimeout(idle)
      }
    }
  }, [chatOpen])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { const dark = settings.theme === 'dark' || (settings.theme === 'auto' && media.matches); document.documentElement.classList.toggle('dark', dark); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101210' : '#f5f6f3') }
    apply(); media.addEventListener('change', apply)
    document.documentElement.classList.toggle('reduce-motion', !settings.animations); document.documentElement.classList.toggle('parallax-enabled', settings.parallax); document.documentElement.classList.toggle('smoke-enabled', settings.smoke); document.documentElement.dataset.accent = settings.accent; document.documentElement.dataset.density = settings.density; document.documentElement.lang = settings.language
    return () => media.removeEventListener('change', apply)
  }, [settings.theme, settings.animations, settings.parallax, settings.smoke, settings.accent, settings.density, settings.language])
  const navigate = (next: PageId) => { window.location.hash = next === 'dashboard' ? '#/' : `#/${next}`; setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  useEffect(() => { const handler = (event: KeyboardEvent) => { const target = event.target as HTMLElement; const writing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable; if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); (document.querySelector('.global-search input') as HTMLInputElement | null)?.focus() } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') { event.preventDefault(); addTask({ title: en ? 'New task' : 'Nouvelle tâche', status: 'todo', priority: 'medium', dueDate: new Date().toISOString().slice(0, 10), category: en ? 'Personal' : 'Personnel', tags: [], subtasks: [] }); navigate('personal') } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); addNote(); navigate('personal') } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') { event.preventDefault(); navigate('finances') } else if ((event.ctrlKey || event.metaKey) && event.key === '/') { event.preventDefault(); setAssistantReady(true); setChatOpen(true) } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'l') { event.preventDefault(); updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }) } else if ((event.ctrlKey || event.metaKey) && event.key === ',') { event.preventDefault(); navigate('settings') } else if (!writing && event.key.toLowerCase() === 'l') setLocked(true); else if (!writing && event.key.toLowerCase() === 'p') { navigate('dashboard'); window.setTimeout(() => document.getElementById('widget-pomodoro')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200) } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [addNote, addTask, en, setChatOpen, settings.theme, updateSettings])
  const content = useMemo(() => page === 'finances' ? <FinancePage /> : page === 'finance-settings' ? <FinanceSettingsPage /> : page === 'personal' ? <PersonalPage /> : page === 'features' ? <FeaturesPage /> : page === 'settings' ? <SettingsPage /> : <DashboardPage />, [page])
  if (booting) return <div className="boot-screen"><div className="boot-brand"><img src="assets/logo.svg" alt="LifeOS" /><span><strong>LifeOS</strong><small>{en ? 'Preparing your space' : 'Préparation de votre espace'}</small></span></div><div className="boot-shell"><aside /><main><i className="skeleton hero" /><div>{Array.from({ length: 6 }, (_, i) => <i className="skeleton" key={i} />)}</div></main></div></div>
  const unlock = () => { if (!settings.pin || pin === settings.pin) { setLocked(false); setPin(''); setPinError(false) } else { setPinError(true); setPin('') } }
  const assistantButton = <button className="chat-fab chat-fab-lite" onClick={() => { setAssistantReady(true); setChatOpen(true) }} aria-label={en ? 'Open LifeOS Assistant' : 'Ouvrir l’assistant LifeOS'} title="LifeOS Assistant"><MessageCircle size={24} /><i className="chat-fab-ring" /></button>
  return <>
    {settings.smoke && <div className="smoke-layer" aria-hidden="true"><i /><i /></div>}
    <AppShell page={page} onNavigate={navigate}><div key={page} className="route-view"><Suspense fallback={<div className="route-loader"><i /><span>{en ? 'Loading your space…' : 'Chargement de votre espace…'}</span></div>}>{content}</Suspense></div></AppShell>
    {assistantReady ? <Suspense fallback={assistantButton}><Chatbot /></Suspense> : assistantButton}
    <ToastViewport />
    {locked && <div className="lock-screen lock-screen-in"><div className="lock-card"><span className="lock-logo"><LockKeyhole size={28} /></span><img src="assets/logo.svg" alt="LifeOS" /><h1>{en ? 'Welcome back' : 'Heureux de vous revoir'}</h1><p>{settings.pin ? (en ? 'Enter your PIN to return to your space.' : 'Saisissez votre code PIN pour retrouver votre espace.') : (en ? 'Your LifeOS space is locked locally.' : 'Votre espace LifeOS est verrouillé localement.')}</p>{settings.pin && <Input autoFocus type="password" inputMode="numeric" maxLength={4} value={pin} onChange={event => { setPin(event.target.value); setPinError(false) }} onKeyDown={event => event.key === 'Enter' && unlock()} placeholder="••••" className={pinError ? 'input-error pin-input' : 'pin-input'} />}{pinError && <small className="error-text">{en ? 'Incorrect PIN. Try again.' : 'Code incorrect. Réessayez.'}</small>}<Button onClick={unlock}>{settings.pin ? (en ? 'Unlock' : 'Déverrouiller') : (en ? 'Return to LifeOS' : 'Revenir à LifeOS')}</Button><span className="privacy-line"><ShieldCheck size={14} /> {en ? 'Data protected on this device' : 'Données protégées sur cet appareil'}</span></div></div>}
  </>
}
