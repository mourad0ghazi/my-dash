import { BarChart3, Gift, Heart, LayoutDashboard, Settings } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { translate } from '../../i18n/translations'
import type { PageId } from '../../types'

const items = [
  { id: 'dashboard' as PageId, key: 'dashboard' as const, icon: LayoutDashboard },
  { id: 'finances' as PageId, key: 'finances' as const, icon: BarChart3 },
  { id: 'personal' as PageId, key: 'personal' as const, icon: Heart },
  { id: 'features' as PageId, key: 'free' as const, icon: Gift },
  { id: 'settings' as PageId, key: 'settings' as const, icon: Settings },
]
export function MobileNav({ page, onNavigate }: { page: PageId; onNavigate: (page: PageId) => void }) {
  const language = useLifeStore(state => state.settings.language)
  return <nav className="mobile-nav" aria-label="Navigation principale">{items.map(item => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)}><item.icon size={19} /><span>{translate(language, item.key)}</span></button>)}</nav>
}
