import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Banknote, Landmark, Plus, Trash2, TrendingUp, WalletCards } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { calculateCompoundInterest } from '../../utils/calculations'
import { compactCurrency, currency } from '../../utils/numberFormatters'
import { localizeFinanceCategory, localizeInvestmentType } from '../../utils/localization'
import { AnimatedNumber, Badge, Button, EmptyState, Field, IconButton, Input, Modal } from '../ui/primitives'
import { Widget } from '../dashboard/Widget'

const pieColors = ['#272b29', '#515a55', '#758079', '#9ca59f', '#bcc2be', '#d5d9d6', '#e7e9e7']
function useFinanceCopy() {
  const language = useLifeStore(state => state.settings.language)
  return { language, l: (french: string, english: string) => language === 'en' ? english : french }
}
function useFinanceNumbers() {
  const transactions = useLifeStore(state => state.transactions)
  const language = useLifeStore(state => state.settings.language)
  return useMemo(() => {
    const now = new Date(); const current = transactions.filter(item => { const date = new Date(item.date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() })
    const income = current.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0); const expenses = current.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
    const months = Array.from({ length: 6 }, (_, reverse) => { const index = 5 - reverse; const date = new Date(now.getFullYear(), now.getMonth() - index, 1); const monthRows = transactions.filter(item => { const d = new Date(item.date); return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() }); const revenus = monthRows.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0); const depenses = monthRows.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0); return { month: date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'short' }).replace('.', ''), revenus, depenses, epargne: revenus - depenses } })
    return { income, expenses, balance: income - expenses, current, months }
  }, [transactions, language])
}
export function FinanceSummaryWidget({ expanded = false }: { expanded?: boolean }) {
  const { l } = useFinanceCopy()
  const { income, expenses, balance, months } = useFinanceNumbers()
  const settings = useLifeStore(state => state.settings)
  const formatMoney = (value: number) => currency(value, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)
  const hasTransactions = months.some(month => month.revenus > 0 || month.depenses > 0)
  const chart = hasTransactions ? (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={months} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6f8274" stopOpacity={.28} /><stop offset="100%" stopColor="#6f8274" stopOpacity={0} /></linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a66b5d" stopOpacity={.2} /><stop offset="100%" stopColor="#a66b5d" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={value => `${Math.round(value / 1000)}k`} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-solid)' }} formatter={(value: number) => formatMoney(value)} />
        <Area type="monotone" dataKey="revenus" name={l('Revenus', 'Income')} stroke="#6f8274" strokeWidth={2.5} fill="url(#incomeFill)" />
        <Area type="monotone" dataKey="depenses" name={l('Dépenses', 'Expenses')} stroke="#a66b5d" strokeWidth={2} fill="url(#expenseFill)" />
      </AreaChart>
    </ResponsiveContainer>
  ) : <EmptyState icon={<Banknote size={22} />} title={l('Aucun historique financier', 'No financial history')} text={l('Le graphique apparaîtra après vos premières transactions.', 'The chart will appear after your first transactions.')} />
  const content = <>
    <div className="finance-stats">
      <article><span className="stat-icon income"><ArrowUpRight size={17} /></span><small>{l('Revenus', 'Income')}</small><strong><AnimatedNumber value={income} format={formatMoney} /></strong><em>{l('Ce mois', 'This month')}</em></article>
      <article><span className="stat-icon expense"><ArrowDownRight size={17} /></span><small>{l('Dépenses', 'Expenses')}</small><strong><AnimatedNumber value={expenses} format={formatMoney} /></strong><em>{l('Ce mois', 'This month')}</em></article>
      <article><span className="stat-icon saving"><WalletCards size={17} /></span><small>{l('Épargne nette', 'Net savings')}</small><strong><AnimatedNumber value={balance} format={formatMoney} /></strong><em>{income ? `${Math.round(balance / income * 100)}${l(' % du revenu', '% of income')}` : l('Aucun revenu saisi', 'No income entered')}</em></article>
    </div>
    <div className={`chart-wrap ${expanded ? 'chart-tall' : ''}`}>{chart}</div>
  </>
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="finance" title={l('Vue financière', 'Financial overview')} icon={Banknote} eyebrow={l('Ce mois', 'This month')}>{content}</Widget>
}

export function ExpenseChartWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, language } = useFinanceCopy()
  const { current, expenses } = useFinanceNumbers()
  const settings = useLifeStore(state => state.settings)
  const data = useMemo(() => Object.entries(current.filter(item => item.type === 'expense').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + item.amount }), {})).map(([name, value]) => ({ name: localizeFinanceCategory(name, language), value })).sort((a, b) => b.value - a.value), [current, language])
  const content = data.length ? (
    <div className={`expense-layout ${expanded ? 'expense-expanded' : ''}`}>
      <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={3} animationDuration={1000}>{data.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip formatter={(value: number) => currency(value, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-solid)' }} /></PieChart></ResponsiveContainer><div className="donut-center"><small>Total</small><strong>{compactCurrency(expenses, settings.currency, settings.hideAmounts, settings.language, settings.decimalSeparator)}</strong></div></div>
      <div className="chart-legend">{data.map((item, index) => <div key={item.name}><i style={{ background: pieColors[index % pieColors.length] }} /><span>{item.name}</span><strong>{expenses ? Math.round(item.value / expenses * 100) : 0}%</strong></div>)}</div>
    </div>
  ) : <EmptyState icon={<TrendingUp size={22} />} title={l('Aucune dépense ce mois-ci', 'No expenses this month')} text={l('La répartition apparaîtra lorsque vous enregistrerez une dépense.', 'The allocation will appear when you record an expense.')} />
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="expenses" title={l('Répartition des dépenses', 'Expense allocation')} icon={TrendingUp} eyebrow={l('Par catégorie', 'By category')}>{content}</Widget>
}

export function InvestmentsWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, language } = useFinanceCopy()
  const investments = useLifeStore(state => state.investments); const add = useLifeStore(state => state.addInvestment); const remove = useLifeStore(state => state.deleteInvestment); const settings = useLifeStore(state => state.settings)
  const [open, setOpen] = useState(false); const [name, setName] = useState(''); const [symbol, setSymbol] = useState(''); const [type, setType] = useState(''); const [value, setValue] = useState(0); const [change, setChange] = useState(0)
  const total = investments.reduce((sum, item) => sum + item.value, 0); const averageChange = total > 0 ? investments.reduce((sum, item) => sum + item.value * item.change, 0) / total : 0; const data = investments.map(item => ({ name: item.type, value: item.value }))
  const submit = () => { if (!name.trim() || !symbol.trim() || !type.trim() || value < 0) return; add({ name: name.trim(), symbol: symbol.trim().toUpperCase(), type: type.trim(), value, change }); setName(''); setSymbol(''); setType(''); setValue(0); setChange(0); setOpen(false) }
  const content = <>
    <div className="module-toolbar"><span className="transaction-count">{investments.length} {l('placement(s)', 'investments')}</span><Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> {l('Ajouter', 'Add')}</Button></div>
    {investments.length ? <><div className="investment-head"><span><small>{l('Valeur du portefeuille', 'Portfolio value')}</small><strong>{currency(total, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong></span><Badge tone={averageChange >= 0 ? 'success' : 'danger'}>{averageChange >= 0 ? '+' : ''}{new Intl.NumberFormat(language === 'en' ? 'en-US' : 'fr-FR', { maximumFractionDigits: 1 }).format(averageChange)}%</Badge></div><div className="investment-layout"><div className="mini-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius="48%" outerRadius="82%" paddingAngle={4}>{data.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}</Pie></PieChart></ResponsiveContainer></div><div className="investment-list">{investments.map((item, index) => <article key={item.id}><i style={{ background: pieColors[index % pieColors.length] }} /><span><strong>{item.name}</strong><small>{item.symbol} · {localizeInvestmentType(item.type, language)}</small></span><span><strong>{compactCurrency(item.value, settings.currency, settings.hideAmounts, settings.language, settings.decimalSeparator)}</strong><small className={item.change >= 0 ? 'positive' : 'negative'}>{item.change >= 0 ? '+' : ''}{new Intl.NumberFormat(language === 'en' ? 'en-US' : 'fr-FR').format(item.change)}%</small></span>{expanded && <IconButton label={l('Supprimer', 'Delete')} onClick={() => remove(item.id)}><Trash2 size={14} /></IconButton>}</article>)}</div></div></> : <EmptyState icon={<Landmark size={22} />} title={l('Aucun placement', 'No investments')} text={l('Ajoutez uniquement vos propres placements et leur valeur actuelle.', 'Add only your own investments and current values.')} action={<Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> {l('Ajouter un placement', 'Add an investment')}</Button>} />}
    <Modal open={open} onClose={() => setOpen(false)} title={l('Nouveau placement', 'New investment')}><div className="form-grid"><Field label={l('Nom', 'Name')}><Input autoFocus value={name} onChange={event => setName(event.target.value)} /></Field><Field label={l('Symbole', 'Symbol')}><Input value={symbol} onChange={event => setSymbol(event.target.value)} /></Field><Field label={l('Type', 'Type')}><Input value={type} onChange={event => setType(event.target.value)} /></Field><Field label={l('Valeur actuelle', 'Current value')}><Input type="number" min="0" value={value || ''} onChange={event => setValue(Number(event.target.value))} /></Field><Field label={l('Variation (%)', 'Change (%)')}><Input type="number" step="0.1" value={change || ''} onChange={event => setChange(Number(event.target.value))} /></Field></div><div className="modal-actions"><Button variant="ghost" onClick={() => setOpen(false)}>{l('Annuler', 'Cancel')}</Button><Button onClick={submit}>{l('Ajouter', 'Add')}</Button></div></Modal>
  </>
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="investments" title={l('Investissements', 'Investments')} icon={Landmark} eyebrow={l('Portefeuille', 'Portfolio')}>{content}</Widget>
}

export function SavingsSimulator() {
  const { l } = useFinanceCopy()
  const settings = useLifeStore(state => state.settings); const [initial, setInitial] = useState(0); const [monthly, setMonthly] = useState(0); const [rate, setRate] = useState(0); const [years, setYears] = useState(10); const data = useMemo(() => calculateCompoundInterest(initial, monthly, rate, years), [initial, monthly, rate, years]); const last = data[data.length - 1]
  return <div className="simulator-layout"><div className="simulator-form"><header><span className="feature-icon"><TrendingUp size={20} /></span><div><h3>{l('Simulateur d’épargne', 'Savings simulator')}</h3><p>{l('Projetez votre capital avec les intérêts composés.', 'Project your capital with compound interest.')}</p></div></header><SliderField label={l('Capital initial', 'Initial capital')} value={initial} min={0} max={100000} step={1000} suffix={settings.currency} onChange={setInitial} /><SliderField label={l('Versement mensuel', 'Monthly contribution')} value={monthly} min={0} max={10000} step={100} suffix={settings.currency} onChange={setMonthly} /><SliderField label={l('Rendement annuel', 'Annual return')} value={rate} min={0} max={15} step={.1} suffix="%" onChange={setRate} /><SliderField label={l('Durée', 'Term')} value={years} min={1} max={35} step={1} suffix={l('ans', 'years')} onChange={setYears} /></div><div className="simulator-results"><div className="simulator-cards"><article><small>{l('Capital final', 'Final capital')}</small><strong>{currency(last.withInterest, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong></article><article><small>{l('Intérêts gagnés', 'Interest earned')}</small><strong className="positive">+{currency(last.interest, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong></article><article><small>{l('Total investi', 'Total invested')}</small><strong>{currency(last.invested, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)}</strong></article></div><div className="chart-tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="simFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#687a6e" stopOpacity={.3} /><stop offset="1" stopColor="#687a6e" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} /><YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} /><Tooltip formatter={(value: number) => currency(value, settings.currency, settings.language, settings.hideAmounts, settings.decimalSeparator)} /><Legend /><Area name={l('Avec intérêts', 'With interest')} type="monotone" dataKey="withInterest" stroke="#687a6e" strokeWidth={2.5} fill="url(#simFill)" /><Area name={l('Sans intérêts', 'Without interest')} type="monotone" dataKey="invested" stroke="#a7ada9" strokeDasharray="5 4" fill="none" /></AreaChart></ResponsiveContainer></div></div></div>
}
function SliderField({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) { const { language } = useFinanceCopy(); return <label className="slider-field"><span><strong>{label}</strong><em>{new Intl.NumberFormat(language === 'en' ? 'en-US' : 'fr-FR').format(value)} {suffix}</em></span><input type="range" value={value} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} /></label> }


export function LoanYearlyChart({ data, currencyCode, language, hideAmounts, decimalSeparator }: {
  data: { year: number; principal: number; interest: number; balance: number }[]
  currencyCode: string; language: 'fr' | 'en'; hideAmounts: boolean; decimalSeparator: ',' | '.'
}) {
  const l = (french: string, english: string) => language === 'en' ? english : french
  return <div className="chart-tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} /><YAxis tickFormatter={value => `${Math.round(value / 1000)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} /><Tooltip formatter={(value: number) => currency(value, currencyCode, language, hideAmounts, decimalSeparator)} /><Legend /><Bar name={l('Capital', 'Principal')} dataKey="principal" stackId="a" fill="#697a70" radius={[3, 3, 0, 0]} /><Bar name={l('Intérêts', 'Interest')} dataKey="interest" stackId="a" fill="#c1a28e" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
}
