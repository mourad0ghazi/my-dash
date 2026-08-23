import { type ReactNode, useState } from 'react'
import type { PageId } from '../../types'
import { translate } from '../../i18n/translations'
import { useLifeStore } from '../../store/useLifeStore'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { InstallAppBanner } from '../pwa/InstallApp'

export function AppShell({ page, onNavigate, children }: { page: PageId; onNavigate: (page: PageId) => void; children: ReactNode }) {
  const [menu, setMenu] = useState(false)
  const language = useLifeStore(state => state.settings.language)
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
  return <div className="app-shell"><Sidebar page={page} onNavigate={onNavigate} mobileOpen={menu} onClose={() => setMenu(false)} /><Header page={page} onNavigate={onNavigate} onMenu={() => setMenu(true)} /><main className="app-main"><InstallAppBanner />{children}<footer className="app-footer">LifeOS v2.1 <span>·</span> {t('localData')} <span>·</span> {t('allFree')} <span>·</span> {t('madeCare')}</footer></main><MobileNav page={page} onNavigate={onNavigate} /></div>
}
