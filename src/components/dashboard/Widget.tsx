import { type LucideIcon, ArrowDown, ArrowUp, GripVertical, MoreHorizontal, EyeOff } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { IconButton } from '../ui/primitives'
import { useLifeStore } from '../../store/useLifeStore'

export function Widget({ id, title, icon: Icon, eyebrow, action, children, className = '' }: { id: string; title: string; icon: LucideIcon; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const editMode = useLifeStore(state => state.editMode)
  const toggle = useLifeStore(state => state.toggleWidget)
  const moveWidget = useLifeStore(state => state.moveWidget)
  const language = useLifeStore(state => state.settings.language)
  const l = (french: string, english: string) => language === 'en' ? english : french
  const [menu, setMenu] = useState(false)
  return <article id={`widget-${id}`} className={`widget widget-in ${editMode ? 'widget-editing' : ''} ${className}`}>
    <header className="widget-header drag-handle">
      <div className="widget-title"><GripVertical className="widget-grip" size={16} /><span className="widget-icon"><Icon size={17} /></span><div>{eyebrow && <small>{eyebrow}</small>}<h3>{title}</h3></div></div>
      <div className="widget-actions" onMouseDown={event => event.stopPropagation()}>{action}<IconButton label={`${l('Options de', 'Options for')} ${title}`} onClick={() => setMenu(value => !value)}><MoreHorizontal size={17} /></IconButton>{menu && <div className="widget-menu"><button onClick={() => { toggle(id); setMenu(false) }}><EyeOff size={15} /> {l('Masquer ce module', 'Hide this module')}</button></div>}</div>
    </header>
    <div className="widget-content">{children}</div>
    {editMode && <>
      <div className="edit-chip">{l('Déplacer · Redimensionner', 'Move · Resize')}</div>
      <div className="widget-mobile-order" onPointerDown={event => event.stopPropagation()}>
        <button type="button" onClick={() => moveWidget(id, 'up')}><ArrowUp size={15} /> {l('Monter', 'Move up')}</button>
        <button type="button" onClick={() => moveWidget(id, 'down')}><ArrowDown size={15} /> {l('Descendre', 'Move down')}</button>
      </div>
    </>}
  </article>
}
