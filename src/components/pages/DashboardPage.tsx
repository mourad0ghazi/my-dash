import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CloudSun, Flame, LayoutGrid, Pencil, Sparkles, WalletCards } from 'lucide-react'
import type { Layouts } from 'react-grid-layout'
import { useLifeStore } from '../../store/useLifeStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { shortDate } from '../../utils/core'
import { currency } from '../../utils/numberFormatters'
import { translate } from '../../i18n/translations'
import { Button } from '../ui/primitives'
import { ExcelImporter } from '../import/ExcelImporter'

const DashboardGrid = lazy(() => import('../dashboard/DashboardGrid').then(module => ({ default: module.DashboardGrid })))
const essentialModules = () => import('../modules/EssentialModules')
const personalModules = () => import('../modules/PersonalModules')
const financeModules = () => import('../modules/FinanceModules')
const financeChartModules = () => import('../modules/FinanceChartModules')
const ClockWidget = lazy(() => essentialModules().then(module => ({ default: module.ClockWidget })))
const WeatherWidget = lazy(() => essentialModules().then(module => ({ default: module.WeatherWidget })))
const PomodoroWidget = lazy(() => essentialModules().then(module => ({ default: module.PomodoroWidget })))
const TasksWidget = lazy(() => personalModules().then(module => ({ default: module.TasksWidget })))
const NotesWidget = lazy(() => personalModules().then(module => ({ default: module.NotesWidget })))
const HabitsWidget = lazy(() => personalModules().then(module => ({ default: module.HabitsWidget })))
const JournalWidget = lazy(() => personalModules().then(module => ({ default: module.JournalWidget })))
const GoalsWidget = lazy(() => personalModules().then(module => ({ default: module.GoalsWidget })))
const CalendarWidget = lazy(() => personalModules().then(module => ({ default: module.CalendarWidget })))
const BudgetWidget = lazy(() => financeModules().then(module => ({ default: module.BudgetWidget })))
const SavingsWidget = lazy(() => financeModules().then(module => ({ default: module.SavingsWidget })))
const TransactionsWidget = lazy(() => financeModules().then(module => ({ default: module.TransactionsWidget })))
const LoanCalculator = lazy(() => financeModules().then(module => ({ default: module.LoanCalculator })))
const ExpenseChartWidget = lazy(() => financeChartModules().then(module => ({ default: module.ExpenseChartWidget })))
const FinanceSummaryWidget = lazy(() => financeChartModules().then(module => ({ default: module.FinanceSummaryWidget })))
const InvestmentsWidget = lazy(() => financeChartModules().then(module => ({ default: module.InvestmentsWidget })))

const widgets: Record<string, React.ReactNode> = {
  clock: <ClockWidget />, weather: <WeatherWidget />, pomodoro: <PomodoroWidget />, savings: <SavingsWidget />, finance: <FinanceSummaryWidget />, expenses: <ExpenseChartWidget />,
  tasks: <TasksWidget />, habits: <HabitsWidget />, calendar: <CalendarWidget />, budget: <BudgetWidget />, transactions: <TransactionsWidget />, notes: <NotesWidget />,
  goals: <GoalsWidget />, journal: <JournalWidget />, investments: <InvestmentsWidget />, loan: <LoanCalculator />,
}
const essentialIds = new Set(['clock', 'weather', 'pomodoro'])
const WidgetPlaceholder = () => <div className="dashboard-widget-placeholder" aria-hidden="true"><i /><i /><i /></div>

export function DashboardPage() {
  const [renderStage, setRenderStage] = useState(0)
  const profile = useLifeStore(state => state.profile); const settings = useLifeStore(state => state.settings); const tasks = useLifeStore(state => state.tasks); const habits = useLifeStore(state => state.habits); const transactions = useLifeStore(state => state.transactions)
  const layouts = useLifeStore(state => state.layouts); const visible = useLifeStore(state => state.visibleWidgets); const editMode = useLifeStore(state => state.editMode); const setEditMode = useLifeStore(state => state.setEditMode); const setLayouts = useLifeStore(state => state.setLayouts); const lastExcelImport = useLifeStore(state => state.lastExcelImport)
  const mobile = useMediaQuery('(max-width: 767px)'); const now = new Date()
  useEffect(() => {
    const firstFrame = window.requestAnimationFrame(() => setRenderStage(1))
    const topRow = window.setTimeout(() => setRenderStage(stage => Math.max(stage, 2)), 220)
    let idle: number | undefined
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const remaining = window.setTimeout(() => {
      const reveal = () => setRenderStage(3)
      idle = typeof idleWindow.requestIdleCallback === 'function' ? idleWindow.requestIdleCallback(reveal, { timeout: 1200 }) : window.setTimeout(reveal, 0)
    }, 800)
    return () => {
      window.cancelAnimationFrame(firstFrame); window.clearTimeout(topRow); window.clearTimeout(remaining)
      if (idle !== undefined) {
        if (typeof idleWindow.cancelIdleCallback === 'function') idleWindow.cancelIdleCallback(idle)
        else window.clearTimeout(idle)
      }
    }
  }, [])
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key); const greeting = now.getHours() >= 18 ? t('evening') : t('hello'); const en = settings.language === 'en'
  const activeTasks = tasks.filter(task => task.status !== 'done').length; const bestHabit = habits.reduce<(typeof habits)[number] | null>((best, habit) => !best || habit.bestStreak > best.bestStreak ? habit : best, null); const bestStreak = bestHabit?.bestStreak ?? 0
  const currentTransactions = transactions.filter(item => { const date = new Date(item.date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() }); const balance = currentTransactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0)
  const firstName = profile.name.trim().split(/\s+/)[0] ?? ''
  const widgetOrder = [...(layouts.lg ?? [])].sort((a, b) => a.y - b.y || a.x - b.x).map(item => item.i)
  const visibleIds = [...Object.keys(widgets).filter(id => visible[id])].sort((a, b) => { const first = widgetOrder.indexOf(a); const second = widgetOrder.indexOf(b); return (first < 0 ? 999 : first) - (second < 0 ? 999 : second) }); const responsiveLayouts = useMemo(() => layouts as Layouts, [layouts])
  const ready = (id: string) => renderStage >= 3 || (renderStage >= 1 && essentialIds.has(id)) || (renderStage >= 2 && id === 'savings')
  const renderWidget = (id: string) => ready(id) ? <Suspense fallback={<WidgetPlaceholder />}>{widgets[id]}</Suspense> : <WidgetPlaceholder />
  const today = now.toISOString().slice(0, 10)
  return <div className="dashboard-page route-view">
    <section className="welcome-hero hero-in">
      <div className="hero-smoke smoke-one" /><div className="hero-smoke smoke-two" />
      <div className="welcome-copy"><div className="eyebrow"><Sparkles size={14} /> {t('clarity')}</div><h1>{greeting}{firstName ? `, ${firstName}` : ''} <span>✦</span></h1><p>{shortDate(today, settings.language, settings.dateFormat)} · {t('essentials')}</p></div>
      <div className="hero-stats"><article><span className="hero-stat-icon"><WalletCards size={18} /></span><div><small>{t('balance')}</small><strong>{currency(balance, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong></div><em>{currentTransactions.length} {en ? 'entries this month' : 'entrées ce mois'}</em></article><article><span className="hero-stat-icon"><LayoutGrid size={18} /></span><div><small>{t('activeTasks')}</small><strong>{activeTasks}</strong></div><em>{tasks.length - activeTasks} {t('finished')}</em></article><article><span className="hero-stat-icon"><Flame size={18} /></span><div><small>{t('bestStreak')}</small><strong>{bestStreak} {t('days')}</strong></div><em>{bestHabit?.name || (en ? 'No habit yet' : 'Aucune habitude')}</em></article></div>
      <div className="hero-weather"><CloudSun size={26} /><span><strong>{settings.weatherCity || (en ? 'Choose a city' : 'Choisir une ville')}</strong><small>{en ? 'Open the weather widget' : 'Ouvrir le widget météo'}</small></span></div>
    </section>
    <div className="dashboard-toolbar"><div><h2>{t('yourDashboard')}</h2><p>{visibleIds.length} {t('modulesVisible')} · {lastExcelImport ? `${en ? 'Excel source' : 'Source Excel'} : ${lastExcelImport.fileName}` : t('deviceOnly')}</p></div><div className="dashboard-toolbar-actions"><ExcelImporter compact /><Button variant={editMode ? 'primary' : 'secondary'} onClick={() => setEditMode(!editMode)}><Pencil size={15} /> {editMode ? t('finish') : t('customize')}</Button></div></div>
    {editMode && <div className="edit-banner edit-banner-in"><LayoutGrid size={17} /><span><strong>{t('editActive')}</strong> — {t('editHint')}</span></div>}
    {mobile ? <div className="mobile-widget-stack">{visibleIds.map(id => <div key={id}>{renderWidget(id)}</div>)}</div> : <Suspense fallback={<div className="dashboard-grid-loading">{visibleIds.slice(0, 6).map(id => <WidgetPlaceholder key={id} />)}</div>}><DashboardGrid layouts={responsiveLayouts} rowHeight={settings.density === 'compact' ? 54 : settings.density === 'spacious' ? 70 : 62} editMode={editMode} onLayoutChange={(_layout, all) => setLayouts(all)}>{visibleIds.map(id => <div key={id}>{renderWidget(id)}</div>)}</DashboardGrid></Suspense>}
  </div>
}
