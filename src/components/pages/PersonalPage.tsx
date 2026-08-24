import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckSquare, Goal, Heart, NotebookPen, Sparkles, StickyNote } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { translate, type TranslationKey } from '../../i18n/translations'
import { pageTransition } from '../../utils/animations'
import { CalendarWidget, GoalsWidget, HabitsWidget, JournalWidget, NotesWidget, TasksWidget } from '../modules/PersonalModules'

type Tab = 'calendar' | 'tasks' | 'notes' | 'habits' | 'journal' | 'goals'
const tabs: { id: Tab; key: TranslationKey; icon: typeof CalendarDays }[] = [
  { id: 'calendar', key: 'calendar', icon: CalendarDays }, { id: 'tasks', key: 'taskList', icon: CheckSquare }, { id: 'notes', key: 'notes', icon: StickyNote },
  { id: 'habits', key: 'habits', icon: Sparkles }, { id: 'journal', key: 'journal', icon: NotebookPen }, { id: 'goals', key: 'goals', icon: Goal },
]
export function PersonalPage() {
  const [tab, setTab] = useState<Tab>('calendar')
  const tasks = useLifeStore(state => state.tasks)
  const habits = useLifeStore(state => state.habits)
  const goals = useLifeStore(state => state.goals)
  const language = useLifeStore(state => state.settings.language)
  const t = (key: TranslationKey) => translate(language, key)
  const en = language === 'en'
  const done = tasks.filter(task => task.status === 'done').length
  const completedToday = habits.reduce((sum, habit) => sum + (habit.done[new Date().toISOString().slice(0, 10)] ? 1 : 0), 0)
  const goalProgress = goals.reduce((sum, goal) => sum + (goal.target > 0 ? Math.min(1, Math.max(0, goal.progress / goal.target)) : 0), 0)
  const trackedItems = tasks.length + habits.length + goals.length
  const balanceIndex = trackedItems ? Math.round((done + completedToday + goalProgress) / trackedItems * 100) : 0
  const averageGoalProgress = goals.length ? Math.round(goalProgress / goals.length * 100) : 0
  const sectionTitles: Record<Tab, string> = en ? { calendar: 'Your month at a glance', tasks: 'Turn intention into action', notes: 'Your second brain', habits: 'Build consistency', journal: 'A space for yourself', goals: 'SMART goals' } : { calendar: 'Votre mois en un regard', tasks: 'Passez de l’intention à l’action', notes: 'Votre second cerveau', habits: 'Construisez votre régularité', journal: 'Un espace pour vous', goals: 'Objectifs SMART' }
  return <motion.div className="inner-page" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
    <header className="page-heading personal-heading"><div><span className="page-kicker"><Heart size={15} /> {t('personalKicker')}</span><h1>{t('personalTitle')}</h1><p>{t('personalSubtitle')}</p></div><div className="personal-score"><span>{t('balanceIndex')}</span><strong>{balanceIndex}</strong><small>/100 · {trackedItems ? (en ? 'From your data' : 'Selon vos données') : (en ? 'No data yet' : 'Aucune donnée')}</small></div></header>
    <div className="metric-strip personal-metrics"><article><small>{t('completedTasks')}</small><strong>{done}/{tasks.length}</strong><span>{en ? 'All tracked tasks' : 'Toutes les tâches suivies'}</span></article><article><small>{t('habitsToday')}</small><strong>{completedToday}/{habits.length}</strong><span>{habits.length ? t('keepGoing') : (en ? 'Add a habit' : 'Ajouter une habitude')}</span></article><article><small>{t('activeGoals')}</small><strong>{goals.length}</strong><span>{averageGoalProgress}% {t('average')}</span></article></div>
    <div className="page-tabs" role="tablist">{tabs.map(item => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={16} />{t(item.key)}</button>)}</div>
    <section className="tab-content"><div className="page-card"><div className="page-card-heading"><div><small>{t(tabs.find(item => item.id === tab)?.key ?? 'personal').toUpperCase()}</small><h2>{sectionTitles[tab]}</h2></div></div>{tab === 'calendar' && <CalendarWidget expanded />}{tab === 'tasks' && <TasksWidget expanded />}{tab === 'notes' && <NotesWidget expanded />}{tab === 'habits' && <HabitsWidget expanded />}{tab === 'journal' && <JournalWidget expanded />}{tab === 'goals' && <GoalsWidget expanded />}</div></section>
  </motion.div>
}
