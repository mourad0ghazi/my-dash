import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, ShieldAlert, Trash2, Wrench } from 'lucide-react'
import { clearIndexedDbStorage } from '../../utils/indexedDbStorage'

interface Props { children: ReactNode }
interface State { failed: boolean; repairing: boolean; resetting: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, repairing: false, resetting: false }

  static getDerivedStateFromError(): Pick<State, 'failed'> { return { failed: true } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LifeOS] Render recovery boundary', error, info.componentStack)
  }

  private clearRuntime = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.filter(key => key.startsWith('lifeos-')).map(key => caches.delete(key)))
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.filter(item => [item.active, item.waiting, item.installing].some(worker => worker?.scriptURL.endsWith('/sw.js'))).map(item => item.unregister()))
      }
      sessionStorage.removeItem('lifeos:chunk-recovery')
    } catch { /* Reloading still gives the application a fresh runtime. */ }
  }

  private repairDisplay = async () => {
    this.setState({ repairing: true })
    await this.clearRuntime()
    window.location.reload()
  }

  private resetLocalData = async () => {
    this.setState({ resetting: true })
    await clearIndexedDbStorage()
    await this.clearRuntime()
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    const en = document.documentElement.lang === 'en'
    const busy = this.state.repairing || this.state.resetting
    return <main className="fatal-screen" role="alert">
      <section className="fatal-card">
        <span className="fatal-icon"><ShieldAlert size={28} /></span>
        <img src="assets/logo.svg" alt="LifeOS" />
        <h1>{en ? 'LifeOS protected your screen' : 'LifeOS a protégé votre écran'}</h1>
        <p>{en ? 'A damaged local snapshot or an outdated cached file interrupted display. Your device data has not been sent anywhere.' : 'Un ancien état local endommagé ou un fichier en cache a interrompu l’affichage. Aucune donnée de votre appareil n’a été envoyée.'}</p>
        <div className="fatal-actions">
          <button className="button button-secondary button-md" disabled={busy} onClick={() => window.location.reload()}><RefreshCw size={16} /> {en ? 'Reload' : 'Recharger'}</button>
          <button className="button button-primary button-md" disabled={busy} onClick={this.repairDisplay}><Wrench size={16} /> {this.state.repairing ? (en ? 'Repairing…' : 'Réparation…') : (en ? 'Repair display' : 'Réparer l’affichage')}</button>
          <button className="button button-ghost button-md fatal-reset" disabled={busy} onClick={this.resetLocalData}><Trash2 size={15} /> {this.state.resetting ? (en ? 'Resetting…' : 'Réinitialisation…') : (en ? 'Reset local data' : 'Effacer les données locales')}</button>
        </div>
        <small>{en ? 'Display repair keeps your personal data. Local reset is only for an irreparably damaged snapshot.' : 'La réparation de l’affichage conserve vos données. L’effacement local sert uniquement si un état est irrécupérable.'}</small>
      </section>
    </main>
  }
}
