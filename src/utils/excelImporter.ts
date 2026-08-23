import type {
  Budget, CalendarEvent, ExcelDataType, ExcelImportCounts, ExcelImportData, ExcelImportPayload, Goal, Habit,
  Investment, Note, Priority, Profile, SavingsGoal, Settings, Task, TaskStatus, Transaction, TransactionType,
} from '../types'
import { todayISO } from './formatters'

type Cell = string | number | boolean | Date | null | undefined
type Row = Cell[]
type HeaderMap = Record<string, number>
type ParsedSheet = { sheet: string; data: Row[] }

const emptyCounts = (): ExcelImportCounts => ({ transactions: 0, budgets: 0, tasks: 0, goals: 0, savings: 0, investments: 0, events: 0, notes: 0, habits: 0 })

const aliases = {
  title: ['titre', 'title', 'libelle', 'libellé', 'description', 'nom', 'name', 'operation', 'opération', 'merchant', 'beneficiaire', 'bénéficiaire', 'tache', 'tâche', 'task', 'objectif', 'goal', 'projet', 'project', 'evenement', 'événement', 'event', 'habitude', 'habit', 'routine'],
  amount: ['montant', 'amount', 'somme', 'total', 'montant mad', 'montant eur', 'value', 'valeur'],
  debit: ['debit', 'débit', 'retrait', 'withdrawal', 'sortie'],
  credit: ['credit', 'crédit', 'depot', 'dépôt', 'deposit', 'entree', 'entrée'],
  type: ['type', 'nature', 'sens', 'transaction type', 'type transaction', 'kind'],
  category: ['categorie', 'catégorie', 'category', 'famille', 'groupe', 'group'],
  date: ['date', 'date operation', 'date opération', 'booking date', 'transaction date', 'jour', 'day', 'echeance', 'échéance', 'due date'],
  planned: ['budget', 'prevu', 'prévu', 'planned', 'limite', 'limit', 'plafond', 'budget mensuel'],
  spent: ['depense', 'dépense', 'depense actuelle', 'dépense actuelle', 'spent', 'utilise', 'utilisé', 'realise', 'réalisé'],
  status: ['statut', 'status', 'etat', 'état', 'termine', 'terminé', 'done', 'completed'],
  priority: ['priorite', 'priorité', 'priority', 'importance', 'urgence'],
  dueDate: ['echeance', 'échéance', 'date limite', 'due date', 'deadline'],
  tags: ['tags', 'etiquettes', 'étiquettes', 'labels', 'mots cles', 'mots clés'],
  progress: ['progression', 'progress', 'avancee', 'avancée', 'actuel', 'current', 'realise', 'réalisé'],
  target: ['cible', 'target', 'valeur cible', 'montant cible', 'objectif chiffre', 'objectif chiffré'],
  unit: ['unite', 'unité', 'unit', 'mesure'],
  current: ['actuel', 'current', 'epargne actuelle', 'épargne actuelle', 'solde actuel', 'saved', 'economise', 'économisé'],
  symbol: ['symbole', 'symbol', 'ticker', 'code'],
  value: ['valeur', 'value', 'valorisation', 'montant', 'amount', 'solde'],
  change: ['variation', 'change', 'performance', 'rendement', 'gain', 'evolution', 'évolution'],
  time: ['heure', 'time', 'horaire'],
  color: ['couleur', 'color'],
  content: ['contenu', 'content', 'texte', 'text', 'note', 'details', 'détails'],
  updated: ['modifie le', 'modifié le', 'updated', 'last update', 'date modification'],
  completed: ['fait', 'faite', 'done', 'completed', 'realise', 'réalisé', 'statut', 'status'],
  streak: ['serie', 'série', 'streak', 'meilleure serie', 'meilleure série', 'best streak'],
  field: ['champ', 'field', 'propriete', 'propriété', 'cle', 'clé', 'parametre', 'paramètre'],
  profileValue: ['valeur', 'value', 'contenu', 'content'],
  email: ['email', 'e-mail', 'courriel', 'adresse email', 'adresse e-mail'],
  city: ['ville', 'city', 'localite', 'localité'],
  phone: ['telephone', 'téléphone', 'phone', 'mobile'],
  birthDate: ['date de naissance', 'birth date', 'birthday', 'naissance'],
  bio: ['bio', 'biographie', 'about', 'a propos', 'à propos'],
  currency: ['devise', 'currency', 'monnaie'],
  language: ['langue', 'language'],
  dateFormat: ['format date', 'format de date', 'date format'],
  decimalSeparator: ['separateur decimal', 'séparateur décimal', 'decimal separator', 'decimal symbol'],
  timezone: ['fuseau horaire', 'timezone', 'time zone'],
  hourFormat: ['format heure', 'format de heure', 'time format', 'hour format'],
  firstDay: ['premier jour', 'first day', 'week starts'],
  theme: ['theme', 'thème', 'mode affichage'],
  density: ['densite', 'densité', 'density'],
  accent: ['accent', 'couleur accent', 'accent color'],
  weatherCity: ['ville meteo', 'ville météo', 'weather city'],
  hideAmounts: ['masquer montants', 'hide amounts'],
  notifications: ['notifications', 'alertes', 'alerts'],
  budgetAlerts: ['alertes budget', 'budget alerts'],
  coachEnabled: ['coach', 'coach actif', 'coach enabled'],
  coachFrequency: ['frequence coach', 'fréquence coach', 'coach frequency'],
  coachTime: ['heure coach', 'coach time'],
  journalLocked: ['journal protege', 'journal protégé', 'journal locked'],
  animations: ['animations', 'animation'],
  smoke: ['brume', 'smoke'],
  parallax: ['parallaxe', 'parallax'],
  pin: ['pin', 'code pin'],
} as const

type AliasKey = keyof typeof aliases
const normalize = (value: unknown) => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_./\\-]+/g, ' ').replace(/\s+/g, ' ')
const normalizedAliases = Object.fromEntries(Object.entries(aliases).map(([key, values]) => [key, values.map(normalize)])) as Record<AliasKey, string[]>
const allAliases = new Set(Object.values(normalizedAliases).flat())

function findColumn(headers: string[], key: AliasKey): number {
  const candidates = normalizedAliases[key]
  const exact = headers.findIndex(header => candidates.includes(header))
  if (exact >= 0) return exact
  return headers.findIndex(header => candidates.some(candidate => candidate.length >= 5 && header.includes(candidate)))
}

function findHeaderRow(rows: Row[]): number {
  let bestIndex = 0
  let bestScore = -1
  rows.slice(0, 12).forEach((row, index) => {
    const score = row.reduce<number>((total, cell) => {
      const value = normalize(cell)
      return total + (allAliases.has(value) ? 2 : [...allAliases].some(alias => alias.length >= 5 && value.includes(alias)) ? 1 : 0)
    }, 0)
    if (score > bestScore) { bestScore = score; bestIndex = index }
  })
  return bestIndex
}

function mapHeaders(row: Row): { headers: string[]; map: HeaderMap } {
  const headers = row.map(normalize)
  const map: HeaderMap = {}
  ;(Object.keys(aliases) as AliasKey[]).forEach(key => { map[key] = findColumn(headers, key) })
  return { headers, map }
}

const has = (map: HeaderMap, ...keys: AliasKey[]) => keys.some(key => map[key] >= 0)
const cell = (row: Row, map: HeaderMap, key: AliasKey) => map[key] >= 0 ? row[map[key]] : undefined
const text = (value: unknown) => String(value ?? '').trim()
const splitTags = (value: unknown) => text(value).split(/[,;|]/).map(item => item.trim()).filter(Boolean)
const isBlankRow = (row: Row) => row.every(value => value === null || value === undefined || text(value) === '')

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  let cleaned = value.trim().replace(/[\s\u00a0]/g, '').replace(/[^\d,().+\-]/g, '')
  const negative = cleaned.startsWith('(') && cleaned.endsWith(')')
  cleaned = cleaned.replace(/[()]/g, '')
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '')
  } else if (cleaned.includes(',') || cleaned.includes('.')) {
    const separator = cleaned.includes(',') ? ',' : '.'
    const parts = cleaned.split(separator)
    const last = parts.at(-1) ?? ''
    const looksGrouped = last.length === 3 && parts.slice(0, -1).every((part, index) => index === 0 ? /^[-+]?\d{1,3}$/.test(part) : /^\d{3}$/.test(part)) && !/^[-+]?0$/.test(parts[0])
    cleaned = looksGrouped ? parts.join('') : parts.length > 2 ? `${parts.slice(0, -1).join('')}.${last}` : cleaned.replace(separator, '.')
  }
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : undefined
}

function percentValue(value: unknown): number {
  const parsed = numberValue(value) ?? 0
  if (typeof value === 'string' && value.includes('%')) return parsed
  return Math.abs(parsed) <= 1 ? parsed * 100 : parsed
}

function isoDate(value: unknown, fallback = todayISO(), dateFormat: Settings['dateFormat'] = 'DD/MM/YYYY'): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && value > 20000 && value < 100000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    return date.toISOString().slice(0, 10)
  }
  const raw = text(value)
  if (!raw) return fallback
  const numeric = raw.match(/^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/)
  if (numeric) {
    let year: string; let month: string; let day: string
    if (numeric[1].length === 4 || dateFormat === 'YYYY-MM-DD') [year, month, day] = [numeric[1], numeric[2], numeric[3]]
    else if (dateFormat === 'MM/DD/YYYY') [month, day, year] = [numeric[1], numeric[2], numeric[3]]
    else [day, month, year] = [numeric[1], numeric[2], numeric[3]]
    if (year.length === 2) year = `20${year}`
    const candidate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const parsed = new Date(`${candidate}T12:00:00Z`)
    return Number.isNaN(parsed.getTime()) ? fallback : candidate
  }
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10)
}

function detectDateFormat(rows: Row[], language: 'fr' | 'en'): Settings['dateFormat'] | undefined {
  let sawAmbiguous = false
  for (const value of rows.flat()) {
    const raw = text(value)
    if (/^\d{4}[/.\-]\d{1,2}[/.\-]\d{1,2}$/.test(raw)) return 'YYYY-MM-DD'
    const match = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-]\d{2,4}$/)
    if (!match) continue
    const first = Number(match[1]); const second = Number(match[2])
    if (first > 12) return 'DD/MM/YYYY'
    if (second > 12) return 'MM/DD/YYYY'
    sawAmbiguous = true
  }
  return sawAmbiguous ? (language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY') : undefined
}

function detectDecimalSeparator(rows: Row[]): ',' | '.' | undefined {
  for (const value of rows.flat()) {
    if (typeof value !== 'string') continue
    const raw = value.trim().replace(/[\s\u00a0]/g, '')
    if (/^\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}$/.test(raw)) continue
    if (/[-+]?\d+[,.]\d{1,4}(?:\D|$)/.test(raw)) return raw.lastIndexOf(',') > raw.lastIndexOf('.') ? ',' : '.'
  }
  return undefined
}

function detectCurrency(headers: string[], rows: Row[]): string | undefined {
  const sample = [headers.join(' '), ...rows.slice(0, 100).flat().map(text)].join(' ').toUpperCase()
  const code = sample.match(/\b(MAD|EUR|USD|GBP|CAD|CHF|AED|SAR|TND|DZD)\b/)?.[1]
  if (code) return code
  if (sample.includes('€')) return 'EUR'
  if (sample.includes('£')) return 'GBP'
  if (sample.includes('$')) return 'USD'
  if (/(?:د\.م\.|DH|DIRHAM)/i.test(sample)) return 'MAD'
  return undefined
}

const truthy = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return ['oui', 'yes', 'true', 'fait', 'done', 'termine', 'terminee', 'completed', 'x', '1'].includes(normalize(value))
}
const safeType = (value: unknown): TransactionType | undefined => {
  const normalized = normalize(value)
  if (['revenu', 'revenus', 'income', 'credit', 'entree', 'recette', 'deposit'].some(word => normalized.includes(word))) return 'income'
  if (['depense', 'depenses', 'expense', 'debit', 'sortie', 'achat', 'withdrawal'].some(word => normalized.includes(word))) return 'expense'
  return undefined
}
const taskStatus = (value: unknown): TaskStatus => {
  const normalized = normalize(value)
  if (['termine', 'terminee', 'done', 'completed', 'fait', 'ferme'].some(word => normalized.includes(word))) return 'done'
  if (['cours', 'doing', 'progress', 'started', 'commence'].some(word => normalized.includes(word))) return 'doing'
  return 'todo'
}
const priority = (value: unknown): Priority => {
  const normalized = normalize(value)
  if (['urgent', 'critique', 'critical'].some(word => normalized.includes(word))) return 'urgent'
  if (['haute', 'high', 'important', 'elevee'].some(word => normalized.includes(word))) return 'high'
  if (['basse', 'low', 'faible'].some(word => normalized.includes(word))) return 'low'
  return 'medium'
}

const sheetTerms: Record<ExcelDataType, string[]> = {
  transactions: ['transaction', 'operation', 'mouvement', 'depense', 'expense', 'releve', 'bank'],
  budgets: ['budget', 'enveloppe'], tasks: ['tache', 'task', 'todo', 'action'], goals: ['objectif', 'goal', 'smart'],
  savings: ['epargne', 'saving', 'economies'], investments: ['investissement', 'investment', 'portfolio', 'portefeuille', 'actif'],
  events: ['calendrier', 'calendar', 'evenement', 'event', 'agenda'], notes: ['note', 'memo'], habits: ['habitude', 'habit', 'routine'],
  profile: ['profil', 'profile', 'identite', 'identity'], settings: ['parametre', 'setting', 'preference', 'configuration'],
}

function classifySheet(sheetName: string, map: HeaderMap): ExcelDataType | undefined {
  const name = normalize(sheetName)
  const nameScore = (type: ExcelDataType) => sheetTerms[type].some(term => name.includes(term)) ? 4 : 0
  const scores: Partial<Record<ExcelDataType, number>> = {}
  if (has(map, 'amount', 'debit', 'credit') && has(map, 'title', 'date', 'type', 'category')) scores.transactions = nameScore('transactions') + 3 + (has(map, 'date') ? 1 : 0) + (has(map, 'type', 'debit', 'credit') ? 1 : 0)
  if (has(map, 'planned') && has(map, 'category', 'title')) scores.budgets = nameScore('budgets') + 5 + (has(map, 'spent') ? 1 : 0)
  if (has(map, 'title') && has(map, 'status', 'priority', 'dueDate') && !has(map, 'amount')) scores.tasks = nameScore('tasks') + 3 + (has(map, 'status') ? 1 : 0) + (has(map, 'priority', 'dueDate') ? 1 : 0)
  if (has(map, 'title') && has(map, 'target') && has(map, 'progress', 'unit')) scores.goals = nameScore('goals') + 4 + (has(map, 'unit') ? 1 : 0)
  if (has(map, 'title') && has(map, 'target') && has(map, 'current')) scores.savings = nameScore('savings') + 5
  if (has(map, 'value') && has(map, 'symbol', 'change') && has(map, 'title')) scores.investments = nameScore('investments') + 4 + (has(map, 'symbol') ? 1 : 0)
  if (has(map, 'date') && has(map, 'title') && has(map, 'time', 'color') && !has(map, 'amount')) scores.events = nameScore('events') + 4
  if (has(map, 'content') && has(map, 'title') && !has(map, 'amount')) scores.notes = nameScore('notes') + 4
  if (has(map, 'title') && has(map, 'completed', 'streak') && !has(map, 'amount')) scores.habits = nameScore('habits') + 4
  if (has(map, 'email', 'city', 'phone', 'bio', 'birthDate') || (has(map, 'field') && has(map, 'profileValue'))) scores.profile = nameScore('profile') + 4
  if (has(map, 'currency', 'language')) scores.settings = nameScore('settings') + 4
  const named = (Object.keys(sheetTerms) as ExcelDataType[]).find(type => nameScore(type) > 0)
  if (named && scores[named] === undefined) {
    if (named === 'transactions' && has(map, 'amount', 'debit', 'credit')) scores[named] = 4
    if (named === 'tasks' && has(map, 'title')) scores[named] = 4
    if (named === 'notes' && has(map, 'content', 'title')) scores[named] = 4
    if (named === 'profile' || named === 'settings') scores[named] = 7
  }
  const ranked = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1])) as [ExcelDataType, number][]
  return ranked[0]?.[1] >= 4 ? ranked[0][0] : undefined
}

function sourceId(kind: string, file: string, sheet: string, row: number) {
  const source = `${file}|${sheet}|${row}|${kind}`
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) { hash ^= source.charCodeAt(index); hash = Math.imul(hash, 16777619) }
  return `excel-${kind}-${(hash >>> 0).toString(36)}`
}

function parseTransactions(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): Transaction[] {
  return rows.flatMap((row, index) => {
    const generic = numberValue(cell(row, map, 'amount'))
    const debit = numberValue(cell(row, map, 'debit'))
    const credit = numberValue(cell(row, map, 'credit'))
    const rawAmount = credit && credit !== 0 ? credit : debit && debit !== 0 ? debit : generic
    if (rawAmount === undefined || rawAmount === 0 || isBlankRow(row)) return []
    const title = text(cell(row, map, 'title')) || text(cell(row, map, 'category')) || `Transaction ${index + 1}`
    const inferred = safeType(cell(row, map, 'type')) ?? (credit && credit !== 0 ? 'income' : debit && debit !== 0 ? 'expense' : rawAmount < 0 ? 'expense' : safeType(title) ?? safeType(sheet) ?? 'expense')
    return [{ id: sourceId('transaction', file, sheet, index + offset), title, amount: Math.abs(rawAmount), type: inferred, category: text(cell(row, map, 'category')) || (inferred === 'income' ? 'Revenus' : 'Divers'), date: isoDate(cell(row, map, 'date'), todayISO(), dateFormat) }]
  })
}
function parseBudgets(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number): Budget[] {
  return rows.flatMap((row, index) => {
    const planned = numberValue(cell(row, map, 'planned'))
    const category = text(cell(row, map, 'category')) || text(cell(row, map, 'title'))
    if (!category || planned === undefined || isBlankRow(row)) return []
    return [{ id: sourceId('budget', file, sheet, index + offset), category, planned: Math.abs(planned), spent: Math.abs(numberValue(cell(row, map, 'spent')) ?? 0), icon: '◒' }]
  })
}
function parseTasks(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): Task[] {
  return rows.flatMap((row, index) => {
    const title = text(cell(row, map, 'title'))
    if (!title || isBlankRow(row)) return []
    return [{ id: sourceId('task', file, sheet, index + offset), title, status: taskStatus(cell(row, map, 'status')), priority: priority(cell(row, map, 'priority')), dueDate: isoDate(cell(row, map, 'dueDate') ?? cell(row, map, 'date'), todayISO(), dateFormat), category: text(cell(row, map, 'category')) || 'Personnel', tags: splitTags(cell(row, map, 'tags')), subtasks: [], createdAt: new Date().toISOString() }]
  })
}
function parseGoals(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): Goal[] {
  return rows.flatMap((row, index) => {
    const title = text(cell(row, map, 'title')); const target = numberValue(cell(row, map, 'target'))
    if (!title || target === undefined || target <= 0 || isBlankRow(row)) return []
    return [{ id: sourceId('goal', file, sheet, index + offset), title, category: text(cell(row, map, 'category')) || 'Personnel', progress: Math.max(0, numberValue(cell(row, map, 'progress')) ?? 0), target, unit: text(cell(row, map, 'unit')) || 'unités', dueDate: isoDate(cell(row, map, 'dueDate') ?? cell(row, map, 'date'), todayISO(), dateFormat), milestones: [] }]
  })
}
function parseSavings(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): SavingsGoal[] {
  return rows.flatMap((row, index) => {
    const title = text(cell(row, map, 'title')); const target = numberValue(cell(row, map, 'target'))
    if (!title || target === undefined || target <= 0 || isBlankRow(row)) return []
    return [{ id: sourceId('saving', file, sheet, index + offset), title, current: Math.max(0, numberValue(cell(row, map, 'current')) ?? 0), target: Math.abs(target), dueDate: isoDate(cell(row, map, 'dueDate') ?? cell(row, map, 'date'), todayISO(), dateFormat), icon: '◈' }]
  })
}
function parseInvestments(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number): Investment[] {
  return rows.flatMap((row, index) => {
    const name = text(cell(row, map, 'title')) || text(cell(row, map, 'symbol')); const value = numberValue(cell(row, map, 'value'))
    if (!name || value === undefined || isBlankRow(row)) return []
    return [{ id: sourceId('investment', file, sheet, index + offset), name, symbol: text(cell(row, map, 'symbol')) || name.slice(0, 5).toUpperCase(), type: text(cell(row, map, 'type')) || text(cell(row, map, 'category')) || 'Autre', value: Math.abs(value), change: percentValue(cell(row, map, 'change')) }]
  })
}
function parseEvents(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): CalendarEvent[] {
  return rows.flatMap((row, index) => {
    const title = text(cell(row, map, 'title')); const dateValue = cell(row, map, 'date')
    if (!title || !dateValue || isBlankRow(row)) return []
    const timeValue = cell(row, map, 'time')
    const minutes = typeof timeValue === 'number' && timeValue >= 0 && timeValue < 1 ? Math.round(timeValue * 24 * 60) : undefined
    const formattedTime = minutes !== undefined ? `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}` : timeValue instanceof Date ? timeValue.toISOString().slice(11, 16) : text(timeValue).slice(0, 5)
    return [{ id: sourceId('event', file, sheet, index + offset), title, date: isoDate(dateValue, todayISO(), dateFormat), time: formattedTime || '09:00', color: text(cell(row, map, 'color')) || '#66736a' }]
  })
}
function parseNotes(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): Note[] {
  return rows.flatMap((row, index) => {
    const content = text(cell(row, map, 'content')); const title = text(cell(row, map, 'title')) || `Note ${index + 1}`
    if ((!content && !text(cell(row, map, 'title'))) || isBlankRow(row)) return []
    return [{ id: sourceId('note', file, sheet, index + offset), title, content, pinned: false, tags: splitTags(cell(row, map, 'tags')), updatedAt: `${isoDate(cell(row, map, 'updated'), todayISO(), dateFormat)}T12:00:00.000Z` }]
  })
}
function parseHabits(rows: Row[], map: HeaderMap, file: string, sheet: string, offset: number, dateFormat: Settings['dateFormat']): Habit[] {
  return rows.flatMap((row, index) => {
    const name = text(cell(row, map, 'title')); if (!name || isBlankRow(row)) return []
    const date = isoDate(cell(row, map, 'date'), todayISO(), dateFormat); const completed = truthy(cell(row, map, 'completed'))
    return [{ id: sourceId('habit', file, sheet, index + offset), name, icon: '◇', done: completed ? { [date]: true } : {}, missed: {}, bestStreak: Math.max(0, Math.round(numberValue(cell(row, map, 'streak')) ?? (completed ? 1 : 0))) }]
  })
}

function parseKeyValue(rows: Row[], map: HeaderMap) {
  const values: Record<string, Cell> = {}
  if (map.field >= 0 && map.profileValue >= 0) rows.forEach(row => { const key = normalize(cell(row, map, 'field')); if (key) values[key] = cell(row, map, 'profileValue') })
  return values
}
function pickKey(values: Record<string, Cell>, candidates: string[]) {
  const keys = Object.keys(values); const found = keys.find(key => candidates.map(normalize).includes(key)); return found ? values[found] : undefined
}
function parseProfile(rows: Row[], map: HeaderMap, dateFormat: Settings['dateFormat']): Partial<Profile> {
  const keyed = parseKeyValue(rows, map); const first = rows.find(row => !isBlankRow(row)) ?? []
  const value = (key: AliasKey) => cell(first, map, key) ?? pickKey(keyed, [...aliases[key]])
  const patch: Partial<Profile> = {}
  const name = text(value('title') ?? pickKey(keyed, ['nom', 'name', 'nom complet', 'full name'])); const email = text(value('email')); const city = text(value('city')); const phone = text(value('phone')); const bio = text(value('bio')); const birth = value('birthDate')
  if (name) patch.name = name; if (email) patch.email = email; if (city) patch.city = city; if (phone) patch.phone = phone; if (bio) patch.bio = bio; if (birth) patch.birthDate = isoDate(birth, todayISO(), dateFormat)
  return patch
}
function parseSettings(rows: Row[], map: HeaderMap): Partial<Settings> {
  const keyed = parseKeyValue(rows, map); const first = rows.find(row => !isBlankRow(row)) ?? []
  const value = (key: AliasKey) => cell(first, map, key) ?? pickKey(keyed, [...aliases[key]])
  const currency = text(value('currency')).toUpperCase(); const languageRaw = normalize(value('language'))
  const dateRaw = text(value('dateFormat')).toUpperCase().replace(/[.\-]/g, '/').replace(/\s/g, '')
  const decimalRaw = text(value('decimalSeparator')); const timezone = text(value('timezone')); const hourRaw = normalize(value('hourFormat')); const firstDayRaw = normalize(value('firstDay'))
  const themeRaw = normalize(value('theme')); const densityRaw = normalize(value('density')); const accentRaw = normalize(value('accent')); const frequencyRaw = normalize(value('coachFrequency'))
  const patch: Partial<Settings> = {}
  if (/^[A-Z]{3}$/.test(currency)) patch.currency = currency
  if (languageRaw.startsWith('fr')) patch.language = 'fr'; else if (languageRaw.startsWith('en') || languageRaw.startsWith('ang')) patch.language = 'en'
  if (/^(DD\/MM\/YYYY|JJ\/MM\/AAAA)$/.test(dateRaw)) patch.dateFormat = 'DD/MM/YYYY'
  else if (/^(MM\/DD\/YYYY|MM\/JJ\/AAAA)$/.test(dateRaw)) patch.dateFormat = 'MM/DD/YYYY'
  else if (/^(YYYY\/MM\/DD|AAAA\/MM\/JJ)$/.test(dateRaw)) patch.dateFormat = 'YYYY-MM-DD'
  if (decimalRaw.includes(',')) patch.decimalSeparator = ','; else if (decimalRaw.includes('.')) patch.decimalSeparator = '.'
  if (timezone.includes('/')) {
    try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); patch.timezone = timezone } catch { /* Ignore invalid IANA zones. */ }
  }
  if (hourRaw.includes('12')) patch.hour12 = true; else if (hourRaw.includes('24')) patch.hour12 = false
  if (['dimanche', 'sunday', '0'].includes(firstDayRaw)) patch.firstDay = 0; else if (['lundi', 'monday', '1'].includes(firstDayRaw)) patch.firstDay = 1
  if (['light', 'clair'].includes(themeRaw)) patch.theme = 'light'; else if (['dark', 'sombre'].includes(themeRaw)) patch.theme = 'dark'; else if (['auto', 'systeme', 'system'].includes(themeRaw)) patch.theme = 'auto'
  if (['compact', 'compacte'].includes(densityRaw)) patch.density = 'compact'; else if (['comfortable', 'confortable'].includes(densityRaw)) patch.density = 'comfortable'; else if (['spacious', 'spacieuse', 'aeree'].includes(densityRaw)) patch.density = 'spacious'
  if (['smoke', 'sage', 'slate', 'terracotta', 'graphite'].includes(accentRaw)) patch.accent = accentRaw as Settings['accent']
  if (frequencyRaw.includes('daily') || frequencyRaw.includes('quotid')) patch.coachFrequency = 'daily'; else if (frequencyRaw.includes('week') || frequencyRaw.includes('hebdo')) patch.coachFrequency = 'weekly'; else if (frequencyRaw.includes('never') || frequencyRaw.includes('jamais')) patch.coachFrequency = 'never'
  const city = text(value('weatherCity')); const coachTime = text(value('coachTime')).slice(0, 5); const pin = text(value('pin')).replace(/\D/g, '').slice(0, 4)
  if (city) patch.weatherCity = city; if (/^\d{1,2}:\d{2}$/.test(coachTime)) patch.coachTime = coachTime; if (pin.length === 4) patch.pin = pin
  const booleanKeys = ['hideAmounts', 'notifications', 'budgetAlerts', 'coachEnabled', 'journalLocked', 'animations', 'smoke', 'parallax'] as const
  booleanKeys.forEach(key => { const raw = value(key); if (text(raw)) patch[key] = truthy(raw) })
  return patch
}

function combine<T>(current: T[] | undefined, values: T[]) { return current ? [...current, ...values] : values }

export async function parseExcelWorkbook(file: File, language: 'fr' | 'en' = 'fr'): Promise<ExcelImportPayload> {
  const localize = (french: string, english: string) => language === 'en' ? english : french
  if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) throw new Error('format')
  if (file.size > 25 * 1024 * 1024) throw new Error('size')
  let workbook: ParsedSheet[]
  if (/\.xls$/i.test(file.name)) {
    const XLSX = await import('@e965/xlsx')
    const binaryWorkbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    workbook = binaryWorkbook.SheetNames.map(sheet => ({ sheet, data: XLSX.utils.sheet_to_json(binaryWorkbook.Sheets[sheet], { header: 1, raw: true, defval: null }) as Row[] }))
  } else {
    const { default: readExcelFile } = await import('read-excel-file/browser')
    workbook = await readExcelFile(file) as ParsedSheet[]
  }
  const data: ExcelImportData = {}; const counts = emptyCounts(); const detectedSheets: ExcelImportPayload['detectedSheets'] = []; const warnings: string[] = []
  let profilePatch: Partial<Profile> | undefined; let settingsPatch: Partial<Settings> | undefined; let rowCount = 0
  for (const worksheet of workbook) {
    const rows = worksheet.data.filter(row => !isBlankRow(row))
    if (!rows.length) continue
    const headerIndex = findHeaderRow(rows); const { map } = mapHeaders(rows[headerIndex] ?? [])
    if (classifySheet(worksheet.sheet, map) === 'settings') settingsPatch = { ...settingsPatch, ...parseSettings(rows.slice(headerIndex + 1, headerIndex + 10001), map) }
  }
  for (const worksheet of workbook) {
    const rows = worksheet.data.filter(row => !isBlankRow(row))
    if (!rows.length) continue
    const headerIndex = findHeaderRow(rows); const { headers, map } = mapHeaders(rows[headerIndex] ?? [])
    const body = rows.slice(headerIndex + 1, headerIndex + 10001); rowCount += body.length
    const currencyHint = detectCurrency(headers, body); const dateHint = detectDateFormat(body, language); const decimalHint = detectDecimalSeparator(body)
    settingsPatch = { ...settingsPatch, ...(currencyHint && !settingsPatch?.currency ? { currency: currencyHint } : {}), ...(dateHint && !settingsPatch?.dateFormat ? { dateFormat: dateHint } : {}), ...(decimalHint && !settingsPatch?.decimalSeparator ? { decimalSeparator: decimalHint } : {}) }
    const effectiveDateFormat = settingsPatch.dateFormat ?? dateHint ?? (language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY')
    const type = classifySheet(worksheet.sheet, map)
    if (rows.length - headerIndex - 1 > 10000) warnings.push(localize(`${worksheet.sheet} : seules les 10 000 premières lignes ont été importées.`, `${worksheet.sheet}: only the first 10,000 rows were imported.`))
    if (!type) { warnings.push(localize(`${worksheet.sheet} : colonnes non reconnues, feuille ignorée.`, `${worksheet.sheet}: unrecognized columns, sheet skipped.`)); continue }
    let importedRows = 0
    if (type === 'transactions') { const parsed = parseTransactions(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.transactions = combine(data.transactions, parsed); counts.transactions += parsed.length; importedRows = parsed.length }
    if (type === 'budgets') { const parsed = parseBudgets(body, map, file.name, worksheet.sheet, headerIndex + 2); data.budgets = combine(data.budgets, parsed); counts.budgets += parsed.length; importedRows = parsed.length }
    if (type === 'tasks') { const parsed = parseTasks(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.tasks = combine(data.tasks, parsed); counts.tasks += parsed.length; importedRows = parsed.length }
    if (type === 'goals') { const parsed = parseGoals(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.goals = combine(data.goals, parsed); counts.goals += parsed.length; importedRows = parsed.length }
    if (type === 'savings') { const parsed = parseSavings(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.savings = combine(data.savings, parsed); counts.savings += parsed.length; importedRows = parsed.length }
    if (type === 'investments') { const parsed = parseInvestments(body, map, file.name, worksheet.sheet, headerIndex + 2); data.investments = combine(data.investments, parsed); counts.investments += parsed.length; importedRows = parsed.length }
    if (type === 'events') { const parsed = parseEvents(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.events = combine(data.events, parsed); counts.events += parsed.length; importedRows = parsed.length }
    if (type === 'notes') { const parsed = parseNotes(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.notes = combine(data.notes, parsed); counts.notes += parsed.length; importedRows = parsed.length }
    if (type === 'habits') { const parsed = parseHabits(body, map, file.name, worksheet.sheet, headerIndex + 2, effectiveDateFormat); data.habits = combine(data.habits, parsed); counts.habits += parsed.length; importedRows = parsed.length }
    if (type === 'profile') { const parsed = parseProfile(body, map, effectiveDateFormat); profilePatch = { ...profilePatch, ...parsed }; importedRows = Object.keys(parsed).length }
    if (type === 'settings') { const parsed = parseSettings(body, map); settingsPatch = { ...settingsPatch, ...parsed }; importedRows = Object.keys(parsed).length }
    if (importedRows) detectedSheets.push({ name: worksheet.sheet, type, rows: importedRows })
    else warnings.push(localize(`${worksheet.sheet} : aucune ligne exploitable trouvée.`, `${worksheet.sheet}: no usable rows found.`))
  }
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0) + Object.keys(profilePatch ?? {}).length + Object.keys(settingsPatch ?? {}).length
  if (!total) throw new Error('empty')
  return { fileName: file.name, importedAt: new Date().toISOString(), sheetCount: workbook.length, rowCount, detectedSheets, counts, warnings, data, profilePatch, settingsPatch }
}
