import { useState, useSyncExternalStore } from 'react'
import { Check, Download, MoreVertical, Share2, Smartphone, X } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { getInstallSnapshot, requestAppInstall, subscribeToInstall } from '../../pwa/installPrompt'
import { Button, IconButton } from '../ui/primitives'

function useInstallCopy() {
  const language = useLifeStore(state => state.settings.language)
  return { en: language === 'en', l: (french: string, english: string) => language === 'en' ? english : french }
}

export function InstallAppPanel() {
  const install = useSyncExternalStore(subscribeToInstall, getInstallSnapshot)
  const { l } = useInstallCopy()
  const [working, setWorking] = useState(false)
  const beginInstall = async () => {
    setWorking(true)
    try { await requestAppInstall() } finally { setWorking(false) }
  }

  if (install.installed) return <div className="install-panel installed"><span className="install-visual"><Check size={28} /></span><div><h3>{l('LifeOS est installée', 'LifeOS is installed')}</h3><p>{l('Ouvrez-la depuis votre écran d’accueil comme une application. Vos données restent dans ce navigateur.', 'Open it from your home screen like an app. Your data remains in this browser.')}</p></div></div>

  return <div className="install-panel">
    <span className="install-visual"><Smartphone size={30} /></span>
    <div className="install-panel-copy"><span className="page-kicker">{l('APPLICATION MOBILE', 'MOBILE APP')}</span><h3>{l('Ajouter LifeOS à l’écran d’accueil', 'Add LifeOS to your home screen')}</h3><p>{l('Une installation gratuite, sans boutique ni téléchargement d’APK : plein écran, accès rapide et fonctionnement hors connexion après le premier chargement.', 'A free installation with no app store or APK download: full screen, quick access, and offline use after the first load.')}</p>
      {install.canPrompt ? <Button onClick={beginInstall} disabled={working}><Download size={16} /> {working ? l('Ouverture…', 'Opening…') : l('Installer LifeOS', 'Install LifeOS')}</Button> : install.isIOS ? <ol className="install-steps"><li><Share2 size={17} /><span>{l('Dans Safari, touchez le bouton Partager.', 'In Safari, tap the Share button.')}</span></li><li><Download size={17} /><span>{l('Choisissez « Sur l’écran d’accueil », puis « Ajouter ».', 'Choose “Add to Home Screen,” then “Add.”')}</span></li></ol> : install.isAndroid ? <ol className="install-steps"><li><MoreVertical size={17} /><span>{l('Ouvrez le menu de Chrome en haut à droite.', 'Open Chrome’s menu in the top-right corner.')}</span></li><li><Download size={17} /><span>{l('Touchez « Installer l’application » ou « Ajouter à l’écran d’accueil ».', 'Tap “Install app” or “Add to Home screen.”')}</span></li></ol> : <ol className="install-steps"><li><Download size={17} /><span>{l('Ouvrez le menu de votre navigateur et choisissez l’installation de l’application.', 'Open your browser menu and choose the option to install the app.')}</span></li></ol>}
      <small className="install-note">{l('Sur iPhone, utilisez Safari. Sur Android, Chrome offre l’installation la plus directe.', 'On iPhone, use Safari. On Android, Chrome provides the most direct installation.')}</small>
    </div>
  </div>
}

export function InstallAppBanner() {
  const install = useSyncExternalStore(subscribeToInstall, getInstallSnapshot)
  const { l } = useInstallCopy()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('lifeos:install-banner-dismissed') === '1' } catch { return false }
  })
  if (install.installed || dismissed || (!install.isMobile && !install.canPrompt)) return null
  const dismiss = () => { try { sessionStorage.setItem('lifeos:install-banner-dismissed', '1') } catch { /* Storage can be blocked in private contexts. */ } setDismissed(true) }
  const action = install.canPrompt ? () => { void requestAppInstall() } : () => { window.location.hash = '#/settings?section=install'; window.dispatchEvent(new CustomEvent('lifeos:settings-section', { detail: 'install' })) }
  return <aside className="install-banner" aria-label={l('Installation de LifeOS', 'Install LifeOS')}><span><Smartphone size={20} /></span><div><strong>{l('LifeOS sur votre téléphone', 'LifeOS on your phone')}</strong><small>{install.canPrompt ? l('Installez l’application en un geste.', 'Install the app in one tap.') : l('Ajoutez-la gratuitement à l’écran d’accueil.', 'Add it to your home screen for free.')}</small></div><Button size="sm" onClick={action}>{install.canPrompt ? l('Installer', 'Install') : l('Voir', 'View')}</Button><IconButton label={l('Fermer', 'Close')} onClick={dismiss}><X size={15} /></IconButton></aside>
}
