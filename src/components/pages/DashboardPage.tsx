import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CloudSun, Flame, LayoutGrid, Pencil, Sparkles, WalletCards } from 'lucide-react'
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout'
import { format } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useLifeStore } from '../../store/useLifeStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { currency } from '../../utils/formatters'
import { translate } from '../../i18n/translations'
import { fadeInUp, staggerContainer } from '../../utils/animations'
import { Button } from '../ui/primitives'
import { ExcelImporter } from '../import/ExcelImporter'
import { ClockWidget, WeatherWidget, PomodoroWidget, TasksWidget, NotesWidget, HabitsWidget, JournalWidget, GoalsWidget, CalendarWidget } from '../modules/PersonalModules'
import { BudgetWidget, ExpenseChartWidget, FinanceSummaryWidget, InvestmentsWidget, LoanCalculator, SavingsWidget, TransactionsWidget } from '../modules/FinanceModules'

const ResponsiveGrid = WidthProvider(Responsive)
const widgets: Record<string, React.ReactNode> = {
  clock: <ClockWidget />, weather: <WeatherWidget />, pomodoro: <PomodoroWidget />, savings: <SavingsWidget />, finance: <FinanceSummaryWidget />, expenses: <ExpenseChartWidget />,
  tasks: <TasksWidget />, habits: <HabitsWidget />, calendar: <CalendarWidget />, budget: <BudgetWidget />, transactions: <TransactionsWidget />, notes: <NotesWidget />,
  goals: <GoalsWidget />, journal: <JournalWidget />, investments: <InvestmentsWidget />, loan: <LoanCalculator />,
}

export function DashboardPage() {
  const profile = useLifeStore(state => state.profile); const settings = useLifeStore(state => state.settings); const tasks = useLifeStore(state => state.tasks); const habits = useLifeStore(state => state.habits); const transactions = useLifeStore(state => state.transactions)
  const layouts = useLifeStore(state => state.layouts); const visible = useLifeStore(state => state.visibleWidgets); const editMode = useLifeStore(state => state.editMode); const setEditMode = useLifeStore(state => state.setEditMode); const setLayouts = useLifeStore(state => state.setLayouts); const lastExcelImport = useLifeStore(state => state.lastExcelImport)
  const mobile = useMediaQuery('(max-width: 767px)'); const now = new Date(); const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key); const greeting = now.getHours() >= 18 ? t('evening') : t('hello'); const locale = settings.language === 'fr' ? fr : enUS; const en = settings.language === 'en'
  const activeTasks = tasks.filter(task => task.status !== 'done').length; const bestStreak = Math.max(...habits.map(habit => habit.bestStreak), 0)
  const currentTransactions = transactions.filter(item => { const date = new Date(item.date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() }); const balance = currentTransactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0)
  const widgetOrder = [...(layouts.lg ?? [])].sort((a, b) => a.y - b.y || a.x - b.x).map(item => item.i)
  const visibleIds = [...Object.keys(widgets).filter(id => visible[id])].sort((a, b) => { const first = widgetOrder.indexOf(a); const second = widgetOrder.indexOf(b); return (first < 0 ? 999 : first) - (second < 0 ? 999 : second) }); const responsiveLayouts = useMemo(() => layouts as Layouts, [layouts])
  return <motion.div className="dashboard-page" variants={staggerContainer} initial="hidden" animate="visible">
    <motion.section className="welcome-hero" variants={fadeInUp}>
      <div className="hero-smoke smoke-one" /><div className="hero-smoke smoke-two" />
      <div className="welcome-copy"><div className="eyebrow"><Sparkles size={14} /> {t('clarity')}</div><h1>{greeting}, {profile.name.split(' ')[0]} <span>✦</span></h1><p>{format(now, 'EEEE d MMMM yyyy', { locale })} · {t('essentials')}</p></div>
      <div className="hero-stats"><article><span className="hero-stat-icon"><WalletCards size={18} /></span><div><small>{t('balance')}</small><strong>{currency(balance, settings.currency, settings.language, settings.hideAmounts)}</strong></div><em>{en ? '+12.4%' : '+12,4 %'}</em></article><article><span className="hero-stat-icon"><LayoutGrid size={18} /></span><div><small>{t('activeTasks')}</small><strong>{activeTasks}</strong></div><em>{tasks.length - activeTasks} {t('finished')}</em></article><article><span className="hero-stat-icon"><Flame size={18} /></span><div><small>{t('bestStreak')}</small><strong>{bestStreak} {t('days')}</strong></div><em>{en ? 'Meditation' : 'Méditation'}</em></article></div>
      <div className="hero-weather"><CloudSun size={26} /><span><strong>24°</strong><small>{settings.weatherCity} · {t('weatherSunny')}</small></span></div>
    </motion.section>
    <div className="dashboard-toolbar"><div><h2>{t('yourDashboard')}</h2><p>{visibleIds.length} {t('modulesVisible')} · {lastExcelImport ? `${en ? 'Excel source' : 'Source Excel'} : ${lastExcelImport.fileName}` : t('deviceOnly')}</p></div><div className="dashboard-toolbar-actions"><ExcelImporter compact /><Button variant={editMode ? 'primary' : 'secondary'} onClick={() => setEditMode(!editMode)}><Pencil size={15} /> {editMode ? t('finish') : t('customize')}</Button></div></div>
    {editMode && <motion.div className="edit-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><LayoutGrid size={17} /><span><strong>{t('editActive')}</strong> — {t('editHint')}</span></motion.div>}
    {mobile ? <div className="mobile-widget-stack">{visibleIds.map(id => <div key={id}>{widgets[id]}</div>)}</div> : <ResponsiveGrid className="dashboard-grid" layouts={responsiveLayouts} breakpoints={{ lg: 1200, md: 900, sm: 768, xs: 0 }} cols={{ lg: 12, md: 8, sm: 6, xs: 4 }} rowHeight={settings.density === 'compact' ? 54 : settings.density === 'spacious' ? 70 : 62} margin={[16, 16]} containerPadding={[0, 0]} compactType="vertical" isDraggable={editMode} isResizable={editMode} draggableHandle=".drag-handle" resizeHandles={['se']} onLayoutChange={(_layout: Layout[], all: Layouts) => setLayouts(all)} useCSSTransforms>{visibleIds.map(id => <div key={id}>{widgets[id]}</div>)}</ResponsiveGrid>}
  </motion.div>
}
