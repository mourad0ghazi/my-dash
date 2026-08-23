import './pwa/installPrompt'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { AppErrorBoundary } from './components/errors/AppErrorBoundary'

const recoveryKey = 'lifeos:chunk-recovery'
window.addEventListener('vite:preloadError', event => {
  if (sessionStorage.getItem(recoveryKey)) return
  event.preventDefault()
  sessionStorage.setItem(recoveryKey, '1')
  const clearStaleCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.filter(key => key.startsWith('lifeos-')).map(key => caches.delete(key)))
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.filter(item => [item.active, item.waiting, item.installing].some(worker => worker?.scriptURL.endsWith('/sw.js'))).map(item => item.unregister()))
      }
    } finally { window.location.reload() }
  }
  void clearStaleCache()
})

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>)
