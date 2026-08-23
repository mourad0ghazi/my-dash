import { type LucideIcon, GripVertical, MoreHorizontal, EyeOff } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { IconButton } from '../ui/primitives'
import { useLifeStore } from '../../store/useLifeStore'

export function Widget({ id, title, icon: Icon, eyebrow, action, children, className = '' }: { id: string; title: string; icon: LucideIcon; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const editMode = useLifeStore(state => state.editMode)
  const toggle = useLifeStore(state => state.toggleWidget)
  const language = useLifeStore(state => state.settings.language)
  const l = (french: string, english: string) => language === 'en' ? english : french
  const [menu, setMenu] = useState(false)
  return <motion.article id={`widget-${id}`} className={`widget ${editMode ? 'widget-editing' : ''} ${className}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} whileHover={editMode ? undefined : { y: -2 }}>
    <header className="widget-header drag-handle">
      <div className="widget-title"><GripVertical className="widget-grip" size={16} /><span className="widget-icon"><Icon size={17} /></span><div>{eyebrow && <small>{eyebrow}</small>}<h3>{title}</h3></div></div>
      <div className="widget-actions" onMouseDown={event => event.stopPropagation()}>{action}<IconButton label={`${l('Options de', 'Options for')} ${title}`} onClick={() => setMenu(value => !value)}><MoreHorizontal size={17} /></IconButton>{menu && <div className="widget-menu"><button onClick={() => { toggle(id); setMenu(false) }}><EyeOff size={15} /> {l('Masquer ce module', 'Hide this module')}</button></div>}</div>
    </header>
    <div className="widget-content">{children}</div>
    {editMode && <div className="edit-chip">{l('Déplacer · Redimensionner', 'Move · Resize')}</div>}
  </motion.article>
}
