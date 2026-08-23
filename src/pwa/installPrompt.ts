export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface InstallSnapshot {
  canPrompt: boolean
  installed: boolean
  isAndroid: boolean
  isIOS: boolean
  isMobile: boolean
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

const detect = (): InstallSnapshot => {
  const userAgent = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(userAgent)
  return {
    canPrompt: deferredPrompt !== null,
    installed: window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    isAndroid,
    isIOS,
    isMobile: isIOS || isAndroid || window.matchMedia('(max-width: 767px)').matches,
  }
}

let snapshot = detect()
const publish = () => {
  snapshot = detect()
  listeners.forEach(listener => listener())
}

// This module is imported by main.tsx before React mounts, so Chromium's one-shot
// event is retained even while the access screen is still displayed.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEvent
  publish()
})
window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  publish()
})
const displayMode = window.matchMedia('(display-mode: standalone)')
if (typeof displayMode.addEventListener === 'function') displayMode.addEventListener('change', publish)
else displayMode.addListener(publish)

export const subscribeToInstall = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export const getInstallSnapshot = () => snapshot

export async function requestAppInstall() {
  if (!deferredPrompt) return false
  const prompt = deferredPrompt
  deferredPrompt = null
  publish()
  await prompt.prompt()
  const choice = await prompt.userChoice
  if (choice.outcome !== 'accepted') publish()
  return choice.outcome === 'accepted'
}
