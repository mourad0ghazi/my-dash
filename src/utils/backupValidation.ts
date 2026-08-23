import type {
  Budget, CalendarEvent, ChatMessage, ExcelImportRecord, FinanceCoachMessage, FinanceProfile, Goal, GridItem, Habit, HouseholdMember, Integration, Investment, JournalEntry, Milestone, Note, Profile, SavingsGoal, Settings, StoredLayouts, SubTask, Task, Transaction,
} from '../types'

export interface RestorableLifeState {
  profile: Profile
  settings: Settings
  financeProfile: FinanceProfile
  tasks: Task[]
  notes: Note[]
  habits: Habit[]
  journal: JournalEntry[]
  goals: Goal[]
  events: CalendarEvent[]
  transactions: Transaction[]
  budgets: Budget[]
  savings: SavingsGoal[]
  investments: Investment[]
  members: HouseholdMember[]
  layouts: StoredLayouts
  visibleWidgets: Record<string, boolean>
  editMode: boolean
  chat: ChatMessage[]
  unread: number
  financeCoach: FinanceCoachMessage[]
  integrations: Integration[]
  bankConnected: boolean
  apiKey: string
  lastExcelImport?: ExcelImportRecord
}

type Guard<T> = (value: unknown) => value is T
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const string: Guard<string> = (value): value is string => typeof value === 'string'
const boolean: Guard<boolean> = (value): value is boolean => typeof value === 'boolean'
const number: Guard<number> = (value): value is number => typeof value === 'number' && Number.isFinite(value)
const strings: Guard<string[]> = (value): value is string[] => Array.isArray(value) && value.every(string)
const oneOf = <T extends string>(options: readonly T[]): Guard<T> => (value): value is T => string(value) && options.includes(value as T)
const arrayOf = <T>(guard: Guard<T>): Guard<T[]> => (value): value is T[] => Array.isArray(value) && value.every(guard)
const booleanRecord = (value: unknown): value is Record<string, boolean> => record(value) && Object.values(value).every(boolean)
const has = (value: Record<string, unknown>, key: string, guard: Guard<unknown>) => guard(value[key])

const profile: Guard<Profile> = (value): value is Profile => record(value)
  && ['name', 'email', 'bio', 'phone', 'birthDate', 'city'].every(key => has(value, key, string))
  && (value.avatar === undefined || string(value.avatar))

const settings: Guard<Settings> = (value): value is Settings => record(value)
  && oneOf(['light', 'dark', 'auto'])(value.theme)
  && oneOf(['smoke', 'sage', 'slate', 'terracotta', 'graphite'])(value.accent)
  && oneOf(['compact', 'comfortable', 'spacious'])(value.density)
  && oneOf(['fr', 'en'])(value.language)
  && ['currency', 'timezone', 'coachTime', 'pin', 'weatherCity', 'notificationEmail'].every(key => has(value, key, string))
  && oneOf(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])(value.dateFormat)
  && oneOf([',', '.'])(value.decimalSeparator)
  && (value.firstDay === 0 || value.firstDay === 1)
  && ['hour12', 'animations', 'smoke', 'parallax', 'notifications', 'budgetAlerts', 'coachEnabled', 'hideAmounts', 'journalLocked', 'emailNotifications', 'emailBudgetAlerts', 'emailReports'].every(key => has(value, key, boolean))
  && oneOf(['never', 'daily', 'weekly'])(value.coachFrequency)
  && oneOf(['weekly', 'monthly', 'quarterly'])(value.reportFrequency)

const financeProfile: Guard<FinanceProfile> = (value): value is FinanceProfile => record(value)
  && ['employment', 'paydayBehavior', 'primaryGoal', 'goalDeadline', 'dreamProject', 'willingToReduce', 'biggestObstacle', 'financialNote'].every(key => has(value, key, string))
  && ['monthlyIncome', 'irregularIncome', 'housing', 'food', 'transport', 'utilities', 'healthInsurance', 'subscriptions', 'leisure', 'shopping', 'debtPayments', 'debtTotal', 'dependents', 'familySupport', 'emergencySavings', 'moneyStress', 'goalAmount'].every(key => has(value, key, number))
  && oneOf(['stable', 'variable', 'uncertain'])(value.incomeStability)
  && oneOf(['never', 'sometimes', 'monthly', 'weekly'])(value.budgetFrequency)
  && oneOf(['rarely', 'sometimes', 'often'])(value.impulseFrequency)
  && strings(value.priorities)
  && (value.completedAt === undefined || string(value.completedAt))

const subtask: Guard<SubTask> = (value): value is SubTask => record(value) && string(value.id) && string(value.title) && boolean(value.done)
const task: Guard<Task> = (value): value is Task => record(value) && string(value.id) && string(value.title)
  && oneOf(['todo', 'doing', 'done'])(value.status) && oneOf(['low', 'medium', 'high', 'urgent'])(value.priority)
  && string(value.dueDate) && string(value.category) && strings(value.tags) && arrayOf(subtask)(value.subtasks) && string(value.createdAt)
const note: Guard<Note> = (value): value is Note => record(value) && string(value.id) && string(value.title) && string(value.content) && boolean(value.pinned) && strings(value.tags) && string(value.updatedAt)
const habit: Guard<Habit> = (value): value is Habit => record(value) && string(value.id) && string(value.name) && string(value.icon) && booleanRecord(value.done) && booleanRecord(value.missed) && number(value.bestStreak)
const journal: Guard<JournalEntry> = (value): value is JournalEntry => record(value) && string(value.id) && string(value.date) && string(value.mood) && string(value.content) && strings(value.tags)
const milestone: Guard<Milestone> = (value): value is Milestone => record(value) && string(value.id) && string(value.title) && boolean(value.done)
const goal: Guard<Goal> = (value): value is Goal => record(value) && string(value.id) && string(value.title) && string(value.category) && number(value.progress) && number(value.target) && string(value.unit) && string(value.dueDate) && arrayOf(milestone)(value.milestones)
const event: Guard<CalendarEvent> = (value): value is CalendarEvent => record(value) && string(value.id) && string(value.title) && string(value.date) && string(value.time) && string(value.color)
const transaction: Guard<Transaction> = (value): value is Transaction => record(value) && string(value.id) && string(value.title) && number(value.amount) && oneOf(['income', 'expense'])(value.type) && string(value.category) && string(value.date)
const budget: Guard<Budget> = (value): value is Budget => record(value) && string(value.id) && string(value.category) && number(value.planned) && number(value.spent) && string(value.icon)
const saving: Guard<SavingsGoal> = (value): value is SavingsGoal => record(value) && string(value.id) && string(value.title) && number(value.current) && number(value.target) && string(value.dueDate) && string(value.icon)
const investment: Guard<Investment> = (value): value is Investment => record(value) && string(value.id) && string(value.name) && string(value.symbol) && string(value.type) && number(value.value) && number(value.change)
const member: Guard<HouseholdMember> = (value): value is HouseholdMember => record(value) && string(value.id) && string(value.name) && string(value.role) && string(value.initials)
const gridItem: Guard<GridItem> = (value): value is GridItem => record(value) && string(value.i) && number(value.x) && number(value.y) && number(value.w) && number(value.h) && (value.minW === undefined || number(value.minW)) && (value.minH === undefined || number(value.minH))
const layouts: Guard<StoredLayouts> = (value): value is StoredLayouts => record(value) && Object.values(value).every(arrayOf(gridItem))
const chatMessage: Guard<ChatMessage> = (value): value is ChatMessage => record(value) && string(value.id) && oneOf(['user', 'assistant'])(value.role) && string(value.text) && string(value.createdAt)
const financeCoachMessage: Guard<FinanceCoachMessage> = (value): value is FinanceCoachMessage => record(value) && string(value.id) && oneOf(['user', 'assistant'])(value.role) && string(value.text) && string(value.createdAt)
const integration: Guard<Integration> = (value): value is Integration => record(value) && string(value.id) && string(value.name) && boolean(value.enabled)
const importCounts = (value: unknown) => record(value) && ['transactions', 'budgets', 'tasks', 'goals', 'savings', 'investments', 'events', 'notes', 'habits'].every(key => has(value, key, number))
const importAnalysis = (value: unknown) => record(value) && value.mode === 'deep' && number(value.totalRows) && number(value.nonEmptyRows) && number(value.totalCells) && number(value.analyzedSheets) && value.truncated === false
const excelImport: Guard<ExcelImportRecord> = (value): value is ExcelImportRecord => record(value) && string(value.fileName) && string(value.importedAt) && number(value.sheetCount) && number(value.rowCount) && importCounts(value.counts) && (value.analysis === undefined || importAnalysis(value.analysis))

const objectKeys = {
  profile: ['name', 'email', 'bio', 'phone', 'birthDate', 'city', 'avatar'],
  settings: ['theme', 'accent', 'density', 'language', 'currency', 'dateFormat', 'hour12', 'timezone', 'decimalSeparator', 'firstDay', 'animations', 'smoke', 'parallax', 'notifications', 'budgetAlerts', 'coachEnabled', 'coachFrequency', 'coachTime', 'hideAmounts', 'pin', 'journalLocked', 'weatherCity', 'emailNotifications', 'notificationEmail', 'emailBudgetAlerts', 'emailReports', 'reportFrequency'],
  financeProfile: ['employment', 'monthlyIncome', 'irregularIncome', 'incomeStability', 'housing', 'food', 'transport', 'utilities', 'healthInsurance', 'subscriptions', 'leisure', 'shopping', 'debtPayments', 'debtTotal', 'dependents', 'familySupport', 'emergencySavings', 'budgetFrequency', 'impulseFrequency', 'moneyStress', 'paydayBehavior', 'priorities', 'primaryGoal', 'goalAmount', 'goalDeadline', 'dreamProject', 'willingToReduce', 'biggestObstacle', 'financialNote', 'completedAt'],
} as const

function mergeValidated<T extends object>(value: unknown, current: T, keys: readonly string[], guard: Guard<T>): T {
  if (!record(value)) throw new Error('Invalid object section')
  const next = { ...current } as Record<string, unknown>
  keys.forEach(key => { if (Object.prototype.hasOwnProperty.call(value, key)) next[key] = value[key] })
  if (!guard(next)) throw new Error('Invalid object fields')
  return next as T
}

type ArraySection = 'tasks' | 'notes' | 'habits' | 'journal' | 'goals' | 'events' | 'transactions' | 'budgets' | 'savings' | 'investments' | 'members' | 'chat' | 'financeCoach' | 'integrations'
const arraySections: { [K in ArraySection]: Guard<RestorableLifeState[K]> } = {
  tasks: arrayOf(task), notes: arrayOf(note), habits: arrayOf(habit), journal: arrayOf(journal), goals: arrayOf(goal), events: arrayOf(event),
  transactions: arrayOf(transaction), budgets: arrayOf(budget), savings: arrayOf(saving), investments: arrayOf(investment), members: arrayOf(member),
  chat: arrayOf(chatMessage), financeCoach: arrayOf(financeCoachMessage), integrations: arrayOf(integration),
}

/** Builds an atomic, type-safe patch while retaining defaults missing from older backups. */
export function createRestorableLifePatch(value: unknown, current: RestorableLifeState): Partial<RestorableLifeState> {
  if (!record(value)) throw new Error('Backup root must be an object')
  const patch: Partial<RestorableLifeState> = {}
  if (value.profile !== undefined) patch.profile = mergeValidated(value.profile, current.profile, objectKeys.profile, profile)
  if (value.settings !== undefined) patch.settings = mergeValidated(value.settings, current.settings, objectKeys.settings, settings)
  if (value.financeProfile !== undefined) patch.financeProfile = mergeValidated(value.financeProfile, current.financeProfile, objectKeys.financeProfile, financeProfile)
  for (const key of Object.keys(arraySections) as Array<keyof typeof arraySections>) {
    const section = value[key]
    if (section === undefined) continue
    const guard = arraySections[key] as Guard<RestorableLifeState[typeof key]>
    if (!guard(section)) throw new Error(`Invalid ${key} section`)
    ;(patch as Record<string, unknown>)[key] = section
  }
  if (value.layouts !== undefined) { if (!layouts(value.layouts)) throw new Error('Invalid layouts section'); patch.layouts = value.layouts }
  if (value.visibleWidgets !== undefined) { if (!booleanRecord(value.visibleWidgets)) throw new Error('Invalid widgets section'); patch.visibleWidgets = value.visibleWidgets }
  if (value.editMode !== undefined) { if (!boolean(value.editMode)) throw new Error('Invalid edit mode'); patch.editMode = value.editMode }
  if (value.unread !== undefined) { if (!number(value.unread) || value.unread < 0 || !Number.isInteger(value.unread)) throw new Error('Invalid unread count'); patch.unread = value.unread }
  if (value.bankConnected !== undefined) { if (!boolean(value.bankConnected)) throw new Error('Invalid bank state'); patch.bankConnected = value.bankConnected }
  if (value.apiKey !== undefined) { if (!string(value.apiKey)) throw new Error('Invalid API key'); patch.apiKey = value.apiKey }
  if (value.lastExcelImport !== undefined) { if (!excelImport(value.lastExcelImport)) throw new Error('Invalid import history'); patch.lastExcelImport = value.lastExcelImport }
  if (!Object.keys(patch).length) throw new Error('No compatible LifeOS data')
  return patch
}
