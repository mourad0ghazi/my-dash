import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CreditCard, Landmark, PiggyBank, ReceiptText, Target, TrendingUp, WalletCards } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { translate, type TranslationKey } from '../../i18n/translations'
import { currency } from '../../utils/formatters'
import { pageTransition } from '../../utils/animations'
import { BudgetWidget, ExpenseChartWidget, FinanceSummaryWidget, InvestmentsWidget, LoanCalculator, SavingsSimulator, SavingsWidget, TransactionsWidget } from '../modules/FinanceModules'

type Tab = 'overview' | 'transactions' | 'budget' | 'savings' | 'simulator' | 'investments' | 'loan'
const tabs: { id: Tab; key: TranslationKey; icon: typeof BarChart3 }[] = [
  { id: 'overview', key: 'overview', icon: BarChart3 }, { id: 'transactions', key: 'transactions', icon: ReceiptText }, { id: 'budget', key: 'budget', icon: WalletCards },
  { id: 'savings', key: 'goals', icon: Target }, { id: 'simulator', key: 'simulator', icon: TrendingUp }, { id: 'investments', key: 'investments', icon: Landmark }, { id: 'loan', key: 'loan', icon: CreditCard },
]
export function FinancePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const transactions = useLifeStore(state => state.transactions)
  const settings = useLifeStore(state => state.settings)
  const t = (key: TranslationKey) => translate(settings.language, key)
  const en = settings.language === 'en'
  const now = new Date()
  const current = transactions.filter(item => { const d = new Date(item.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = current.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)
  const expense = current.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  return <motion.div className="inner-page" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
    <header className="page-heading"><div><span className="page-kicker"><PiggyBank size={15} /> {t('financeKicker')}</span><h1>{t('financeTitle')}</h1><p>{t('financeSubtitle')}</p></div><div className="heading-balance"><small>{t('trackedWealth')}</small><strong>{currency(86800, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong><span>↗ {en ? '+6.3%' : '+6,3 %'} {t('thisYear')}</span></div></header>
    <div className="page-tabs" role="tablist">{tabs.map(item => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={16} />{t(item.key)}</button>)}</div>
    <section className="tab-content" key={tab}>
      {tab === 'overview' && <div className="overview-grid"><div className="page-card wide"><div className="page-card-heading"><div><small>{en ? 'OVERVIEW' : 'APERÇU'}</small><h2>{en ? 'Six-month evolution' : 'Évolution sur 6 mois'}</h2></div><span className="live-dot">{en ? 'Up to date' : 'À jour'}</span></div><FinanceSummaryWidget expanded /></div><div className="page-card"><div className="page-card-heading"><div><small>{en ? 'THIS MONTH' : 'CE MOIS'}</small><h2>{en ? 'Allocation' : 'Répartition'}</h2></div></div><ExpenseChartWidget expanded /></div><div className="metric-strip"><article><small>{t('income')}</small><strong>{currency(income, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong><span className="positive">{en ? '+6.2%' : '+6,2 %'}</span></article><article><small>{t('expenses')}</small><strong>{currency(expense, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong><span>{en ? '−3.4%' : '−3,4 %'}</span></article><article><small>{t('savingsRate')}</small><strong>{income ? Math.round((income - expense) / income * 100) : 0}%</strong><span className="positive">{t('excellent')}</span></article></div></div>}
      {tab === 'transactions' && <div className="page-card"><div className="page-card-heading"><div><small>{en ? 'HISTORY' : 'HISTORIQUE'}</small><h2>{en ? 'All transactions' : 'Toutes les transactions'}</h2></div></div><TransactionsWidget expanded /></div>}
      {tab === 'budget' && <div className="page-card"><div className="page-card-heading"><div><small>{en ? 'PLANNING' : 'PLANIFICATION'}</small><h2>{en ? 'Monthly budget' : 'Budget mensuel'}</h2></div></div><BudgetWidget expanded /></div>}
      {tab === 'savings' && <div className="page-card"><div className="page-card-heading"><div><small>{en ? 'PROJECTS' : 'PROJETS'}</small><h2>{en ? 'Savings goals' : 'Objectifs d’épargne'}</h2></div></div><SavingsWidget expanded /></div>}
      {tab === 'simulator' && <div className="page-card"><SavingsSimulator /></div>}
      {tab === 'investments' && <div className="page-card"><div className="page-card-heading"><div><small>{en ? 'PORTFOLIO' : 'PORTEFEUILLE'}</small><h2>{t('investments')}</h2></div></div><InvestmentsWidget expanded /></div>}
      {tab === 'loan' && <div className="page-card"><div className="page-card-heading"><div><small>{en ? 'CREDIT' : 'CRÉDIT'}</small><h2>{en ? 'Loan simulator' : 'Simulateur de prêt'}</h2></div></div><LoanCalculator widget={false} /></div>}
    </section>
  </motion.div>
}
