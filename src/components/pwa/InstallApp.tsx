import { useState, useSyncExternalStore } from 'react'
import { Check, Download, MoreVertical, PackageCheck, Share2, ShieldCheck, Smartphone, X } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { getInstallSnapshot, requestAppInstall, subscribeToInstall } from '../../pwa/installPrompt'
import { Button, IconButton } from '../ui/primitives'

const ANDROID_APK_NAME = 'LifeOS-Android-v2.1.0.apk'
const ANDROID_APK_URL = `${import.meta.env.BASE_URL}downloads/${ANDROID_APK_NAME}`

function useInstallCopy() {
  const language = useLifeStore(state => state.settings.language)
  return { en: language === 'en', l: (french: string, english: string) => language === 'en' ? english : french }
}

function isNativeAndroidApp() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  // The embedded Android runtime serves LifeOS from WebView's reserved HTTPS origin.
  // Keep the UA fallback for compatible wrappers that preserve the standard `wv` marker.
  return window.location.hostname === 'appassets.androidplatform.net'
    || (/Android/i.test(navigator.userAgent) && /;\s*wv\)/i.test(navigator.userAgent))
}

export function InstallAppPanel() {
  const install = useSyncExternalStore(subscribeToInstall, getInstallSnapshot)
  const { l } = useInstallCopy()
  const [working, setWorking] = useState(false)
  const nativeAndroid = isNativeAndroidApp()
  const beginInstall = async () => {
    setWorking(true)
    try { await requestAppInstall() } finally { setWorking(false) }
  }

  return <div className="install-panel">
    <span className="install-visual"><Smartphone size={30} /></span>
    <div className="install-panel-copy">
      <span className="page-kicker">{l('APPLICATION MOBILE', 'MOBILE APP')}</span>
      <h3>{l('LifeOS sur votre téléphone', 'LifeOS on your phone')}</h3>
      <p>{l('Choisissez la véritable application Android au format APK ou conservez l’installation web PWA. Les deux versions sont gratuites, privées et utilisables hors connexion.', 'Choose the real Android APK or keep the PWA web installation. Both versions are free, private, and work offline.')}</p>

      <div className="install-mobile-options">
        <article className="install-option install-option-apk">
          <span className="install-option-icon"><PackageCheck size={22} /></span>
          <div>
            <span className="install-option-label">ANDROID · APK</span>
            <strong>{nativeAndroid ? l('Application Android installée', 'Android app installed') : l('Télécharger l’application Android', 'Download the Android app')}</strong>
            <p>{l('Application autonome avec LifeOS intégrée, sans boutique, sans compte et sans paiement.', 'Standalone app with LifeOS built in—no store, account, or payment.')}</p>
          </div>
          {nativeAndroid
            ? <span className="install-status"><Check size={15} /> {l('Installée', 'Installed')}</span>
            : <a className="button button-primary button-md install-download" href={ANDROID_APK_URL} download={ANDROID_APK_NAME}><Download size={16} /> {l('Télécharger l’APK', 'Download APK')}</a>}
          <small><ShieldCheck size={14} /> {l('Version 2.1.0 · Android 5 ou supérieur · signature LifeOS vérifiable', 'Version 2.1.0 · Android 5 or later · verifiable LifeOS signature')}</small>
        </article>

        <article className="install-option">
          <span className="install-option-icon"><Smartphone size={22} /></span>
          <div>
            <span className="install-option-label">PWA · WEB</span>
            <strong>{install.installed ? l('PWA déjà installée', 'PWA already installed') : l('Ajouter depuis le navigateur', 'Add from your browser')}</strong>
            <p>{l('Reste synchronisée avec le site et s’ajoute directement à votre écran d’accueil.', 'Stays in sync with the website and can be added directly to your home screen.')}</p>
          </div>
          {install.installed
            ? <span className="install-status"><Check size={15} /> {l('Installée', 'Installed')}</span>
            : install.canPrompt
              ? <Button variant="secondary" onClick={beginInstall} disabled={working}><Download size={16} /> {working ? l('Ouverture…', 'Opening…') : l('Installer la PWA', 'Install PWA')}</Button>
              : install.isIOS
                ? <ol className="install-steps"><li><Share2 size={17} /><span>{l('Dans Safari, touchez Partager.', 'In Safari, tap Share.')}</span></li><li><Download size={17} /><span>{l('Choisissez « Sur l’écran d’accueil », puis « Ajouter ».', 'Choose “Add to Home Screen,” then “Add.”')}</span></li></ol>
                : install.isAndroid
                  ? <ol className="install-steps"><li><MoreVertical size={17} /><span>{l('Ouvrez le menu de Chrome.', 'Open Chrome’s menu.')}</span></li><li><Download size={17} /><span>{l('Touchez « Installer l’application » ou « Ajouter à l’écran d’accueil ».', 'Tap “Install app” or “Add to Home screen.”')}</span></li></ol>
                  : <ol className="install-steps"><li><Download size={17} /><span>{l('Ouvrez le menu du navigateur et choisissez l’installation de l’application.', 'Open the browser menu and choose the app installation option.')}</span></li></ol>}
        </article>
      </div>

      <small className="install-note">{l('Android peut demander d’autoriser cette installation directe une seule fois. L’APK garde son propre stockage local : utilisez l’export/import LifeOS pour y transférer volontairement vos données PWA.', 'Android may ask you to allow this direct installation once. The APK has its own local storage: use LifeOS export/import to transfer your PWA data voluntarily.')}</small>
    </div>
  </div>
}

export function InstallAppBanner() {
  const install = useSyncExternalStore(subscribeToInstall, getInstallSnapshot)
  const { l } = useInstallCopy()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('lifeos:install-banner-dismissed') === '1' } catch { return false }
  })
  if (isNativeAndroidApp() || install.installed || dismissed || (!install.isMobile && !install.canPrompt)) return null
  const dismiss = () => { try { sessionStorage.setItem('lifeos:install-banner-dismissed', '1') } catch { /* Storage can be blocked in private contexts. */ } setDismissed(true) }
  const action = install.canPrompt ? () => { void requestAppInstall() } : () => { window.location.hash = '#/settings?section=install'; window.dispatchEvent(new CustomEvent('lifeos:settings-section', { detail: 'install' })) }
  return <aside className="install-banner" aria-label={l('Installation de LifeOS', 'Install LifeOS')}><span><Smartphone size={20} /></span><div><strong>{l('LifeOS sur votre téléphone', 'LifeOS on your phone')}</strong><small>{install.canPrompt ? l('Installez l’application en un geste.', 'Install the app in one tap.') : l('APK Android ou PWA : à vous de choisir.', 'Android APK or PWA: choose your version.')}</small></div><Button size="sm" onClick={action}>{install.canPrompt ? l('Installer', 'Install') : l('Voir', 'View')}</Button><IconButton label={l('Fermer', 'Close')} onClick={dismiss}><X size={15} /></IconButton></aside>
}
