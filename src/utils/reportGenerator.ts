import type { Budget, FinanceProfile, Profile, SavingsGoal, Settings, Task, Transaction } from '../types'
import { downloadFile } from './formatters'

export interface LifeReportData {
  profile: Profile
  settings: Settings
  transactions: Transaction[]
  budgets: Budget[]
  savings: SavingsGoal[]
  tasks: Task[]
  financeProfile?: FinanceProfile
}

export interface LifeReportSummary {
  income: number
  expenses: number
  balance: number
  savingsRate: number
  activeTasks: number
  budgetAlerts: number
  goalTitle: string
  goalAmount: number
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)

export function summarizeLifeReport(data: LifeReportData): LifeReportSummary {
  const now = new Date()
  const current = data.transactions.filter(item => {
    const date = new Date(item.date)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })
  const income = current.filter(item => item.type === 'income').reduce((total, item) => total + item.amount, 0)
  const expenses = current.filter(item => item.type === 'expense').reduce((total, item) => total + item.amount, 0)
  const reportedIncome = data.financeProfile ? data.financeProfile.monthlyIncome + data.financeProfile.irregularIncome : 0
  const finalIncome = reportedIncome || income
  return {
    income: finalIncome,
    expenses,
    balance: finalIncome - expenses,
    savingsRate: finalIncome > 0 ? Math.max(0, (finalIncome - expenses) / finalIncome * 100) : 0,
    activeTasks: data.tasks.filter(item => item.status !== 'done').length,
    budgetAlerts: data.budgets.filter(item => item.planned > 0 && item.spent / item.planned >= .8).length,
    goalTitle: data.financeProfile?.primaryGoal || data.savings[0]?.title || '',
    goalAmount: data.financeProfile?.goalAmount || data.savings[0]?.target || 0,
  }
}

function money(value: number, settings: Settings) {
  try { return new Intl.NumberFormat(settings.language === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: settings.currency, maximumFractionDigits: 0 }).format(value) }
  catch { return `${Math.round(value).toLocaleString(settings.language === 'en' ? 'en-US' : 'fr-FR')} ${settings.currency}` }
}

export function createLifeReport(data: LifeReportData, title?: string) {
  const en = data.settings.language === 'en'
  const summary = summarizeLifeReport(data)
  const reportTitle = title || (en ? 'LifeOS personal report' : 'Bilan personnel LifeOS')
  const date = new Intl.DateTimeFormat(en ? 'en-US' : 'fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())
  const objective = summary.goalTitle
    ? `<section class="focus"><small>${en ? 'Priority objective' : 'Objectif prioritaire'}</small><h2>${escapeHtml(summary.goalTitle)}</h2><p>${summary.goalAmount ? money(summary.goalAmount, data.settings) : (en ? 'Amount to be defined' : 'Montant à préciser')}</p></section>`
    : ''
  const alerts = data.budgets.filter(item => item.planned > 0 && item.spent / item.planned >= .8).map(item => `<li><span>${escapeHtml(item.category)}</span><strong>${Math.round(item.spent / item.planned * 100)} %</strong></li>`).join('')
  const savings = data.savings.slice(0, 6).map(item => `<li><span>${escapeHtml(item.title)}</span><strong>${money(item.current, data.settings)} / ${money(item.target, data.settings)}</strong></li>`).join('')
  return `<!doctype html><html lang="${data.settings.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(reportTitle)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#eef0ec;color:#1d211e;font:15px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.page{max-width:920px;margin:32px auto;background:#fff;border:1px solid #dfe3dc;border-radius:24px;box-shadow:0 20px 70px #26352a18;overflow:hidden}.hero{padding:48px;background:linear-gradient(135deg,#1c241f,#3f5046);color:#fff}.brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.04em}.brand i{width:13px;height:13px;border-radius:4px;background:#a9c2af}.hero h1{max-width:650px;margin:48px 0 10px;font-size:42px;line-height:1.05}.hero p{margin:0;color:#d7dfda}.content{padding:34px 42px 44px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card,.focus,.list{border:1px solid #e1e4de;border-radius:16px;padding:18px}.card small,.focus small{display:block;color:#69716b;font-size:11px;text-transform:uppercase;letter-spacing:.09em}.card strong{display:block;margin-top:8px;font-size:23px}.card em{font-style:normal;color:#52705b;font-size:12px}.focus{margin:20px 0;background:#f5f8f5}.focus h2{margin:7px 0 2px}.focus p{margin:0}.columns{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}.list h3{margin:0 0 12px}.list ul{list-style:none;padding:0;margin:0}.list li{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-top:1px solid #eceeea}.list li span{color:#69716b}.empty{color:#7d837e}.footer{padding:20px 42px;border-top:1px solid #e6e9e4;color:#747a75;font-size:12px}@media(max-width:700px){.page{margin:0;border:0;border-radius:0}.hero,.content{padding:28px 22px}.hero h1{font-size:32px;margin-top:34px}.grid{grid-template-columns:1fr 1fr}.columns{grid-template-columns:1fr}}@media print{body{background:#fff}.page{margin:0;max-width:none;border:0;box-shadow:none}.hero{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><main class="page"><header class="hero"><div class="brand"><i></i> LifeOS</div><h1>${escapeHtml(reportTitle)}</h1><p>${escapeHtml(data.profile.name)} · ${escapeHtml(date)}</p></header><div class="content"><div class="grid"><article class="card"><small>${en ? 'Income' : 'Revenus'}</small><strong>${money(summary.income, data.settings)}</strong><em>${en ? 'this month' : 'ce mois'}</em></article><article class="card"><small>${en ? 'Expenses' : 'Dépenses'}</small><strong>${money(summary.expenses, data.settings)}</strong><em>${en ? 'recorded' : 'enregistrées'}</em></article><article class="card"><small>${en ? 'Available' : 'Disponible'}</small><strong>${money(summary.balance, data.settings)}</strong><em>${en ? 'before future spending' : 'avant dépenses futures'}</em></article><article class="card"><small>${en ? 'Savings capacity' : 'Capacité d’épargne'}</small><strong>${Math.round(summary.savingsRate)} %</strong><em>${en ? 'estimated' : 'estimée'}</em></article></div>${objective}<div class="columns"><section class="list"><h3>${en ? 'Savings objectives' : 'Objectifs d’épargne'}</h3>${savings ? `<ul>${savings}</ul>` : `<p class="empty">${en ? 'No objective yet.' : 'Aucun objectif pour le moment.'}</p>`}</section><section class="list"><h3>${en ? 'Points to watch' : 'Points de vigilance'}</h3>${alerts ? `<ul>${alerts}</ul>` : `<p class="empty">${en ? 'No budget alert.' : 'Aucune alerte budget.'}</p>`}<p>${summary.activeTasks} ${en ? 'active LifeOS tasks' : 'tâches LifeOS actives'}.</p></section></div></div><footer class="footer">${en ? 'Generated locally from your LifeOS data. This document is informational and is not financial advice.' : 'Généré localement depuis vos données LifeOS. Ce document est informatif et ne constitue pas un conseil financier réglementé.'}</footer></main></body></html>`
}

export function downloadLifeReport(data: LifeReportData, title?: string) {
  const en = data.settings.language === 'en'
  const stamp = new Date().toISOString().slice(0, 10)
  downloadFile(`${en ? 'lifeos-report' : 'bilan-lifeos'}-${stamp}.html`, createLifeReport(data, title), 'text/html;charset=utf-8')
}

export function printLifeReport(data: LifeReportData, title?: string) {
  const reportWindow = window.open('', '_blank')
  if (!reportWindow) return false
  try {
    reportWindow.opener = null
    let printed = false
    const printOnce = () => { if (!printed && !reportWindow.closed) { printed = true; reportWindow.print() } }
    reportWindow.document.write(createLifeReport(data, title))
    reportWindow.document.close()
    reportWindow.addEventListener('load', printOnce, { once: true })
    window.setTimeout(printOnce, 350)
    return true
  } catch { reportWindow.close(); return false }
}

export function prepareReportEmail(data: LifeReportData, recipient: string) {
  const en = data.settings.language === 'en'
  const summary = summarizeLifeReport(data)
  const subject = en ? 'My LifeOS financial review' : 'Mon bilan financier LifeOS'
  const lines = en ? [
    `Hello,`, '', `Here is my LifeOS review for ${new Date().toLocaleDateString('en-US')}:`,
    `Income: ${money(summary.income, data.settings)}`, `Expenses: ${money(summary.expenses, data.settings)}`, `Available: ${money(summary.balance, data.settings)}`,
    summary.goalTitle ? `Priority: ${summary.goalTitle}` : '', '', 'This draft was prepared locally by LifeOS. I confirm sending it from my email application.',
  ] : [
    'Bonjour,', '', `Voici mon bilan LifeOS du ${new Date().toLocaleDateString('fr-FR')} :`,
    `Revenus : ${money(summary.income, data.settings)}`, `Dépenses : ${money(summary.expenses, data.settings)}`, `Disponible : ${money(summary.balance, data.settings)}`,
    summary.goalTitle ? `Priorité : ${summary.goalTitle}` : '', '', 'Ce brouillon a été préparé localement par LifeOS. Je confirme son envoi depuis mon application e-mail.',
  ]
  window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
}
