import type {
  Budget, CalendarEvent, ChatMessage, FinanceCoachMessage, FinanceProfile, Goal, Habit, HouseholdMember,
  Integration, Investment, JournalEntry, Note, Profile, SavingsGoal, Settings, StoredLayouts, Task, Transaction,
} from '../types'

// LifeOS starts as a private, empty workspace. Only technical display preferences
// are initialized; every personal and activity field is intentionally blank.
export const initialProfile: Profile = {
  name: '', email: '', bio: '', phone: '', birthDate: '', city: '',
}

export const initialSettings: Settings = {
  theme: 'auto', accent: 'smoke', density: 'comfortable', language: 'fr', currency: 'MAD', dateFormat: 'DD/MM/YYYY', hour12: false,
  timezone: 'Africa/Casablanca', decimalSeparator: ',', firstDay: 1, animations: true, smoke: true, parallax: false,
  notifications: false, budgetAlerts: false, coachEnabled: false, coachFrequency: 'never', coachTime: '', hideAmounts: false,
  pin: '', journalLocked: false, weatherCity: '', emailNotifications: false, notificationEmail: '', emailBudgetAlerts: false,
  emailReports: false, reportFrequency: 'monthly',
}

export const initialFinanceProfile: FinanceProfile = {
  employment: '', monthlyIncome: 0, irregularIncome: 0, incomeStability: '', housing: 0, food: 0, transport: 0,
  utilities: 0, healthInsurance: 0, subscriptions: 0, leisure: 0, shopping: 0, debtPayments: 0, debtTotal: 0,
  dependents: 0, familySupport: 0, emergencySavings: 0, budgetFrequency: '', impulseFrequency: '', moneyStress: 0,
  paydayBehavior: '', priorities: [], primaryGoal: '', goalAmount: 0, goalDeadline: '', dreamProject: '',
  willingToReduce: '', biggestObstacle: '', financialNote: '',
}

export const initialTasks: Task[] = []
export const initialNotes: Note[] = []
export const initialHabits: Habit[] = []
export const initialJournal: JournalEntry[] = []
export const initialGoals: Goal[] = []
export const initialEvents: CalendarEvent[] = []
export const initialTransactions: Transaction[] = []
export const initialBudgets: Budget[] = []
export const initialSavings: SavingsGoal[] = []
export const initialInvestments: Investment[] = []
export const initialMembers: HouseholdMember[] = []
export const initialChat: ChatMessage[] = []
export const initialFinanceCoach: FinanceCoachMessage[] = []

export const initialLayouts: StoredLayouts = { lg: [
  { i: 'clock', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 }, { i: 'weather', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'pomodoro', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3 }, { i: 'savings', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
  { i: 'finance', x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 }, { i: 'expenses', x: 6, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
  { i: 'tasks', x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 4 }, { i: 'habits', x: 4, y: 8, w: 4, h: 5, minW: 3, minH: 4 }, { i: 'calendar', x: 8, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
  { i: 'budget', x: 0, y: 13, w: 6, h: 5, minW: 4, minH: 4 }, { i: 'transactions', x: 6, y: 13, w: 6, h: 5, minW: 4, minH: 4 },
  { i: 'notes', x: 0, y: 18, w: 4, h: 5, minW: 3, minH: 4 }, { i: 'goals', x: 4, y: 18, w: 4, h: 5, minW: 3, minH: 4 }, { i: 'journal', x: 8, y: 18, w: 4, h: 5, minW: 3, minH: 4 },
  { i: 'investments', x: 0, y: 23, w: 6, h: 5, minW: 4, minH: 4 }, { i: 'loan', x: 6, y: 23, w: 6, h: 5, minW: 4, minH: 4 },
] }
export const initialVisible = Object.fromEntries(initialLayouts.lg.map(item => [item.i, true])) as Record<string, boolean>
export const initialIntegrations: Integration[] = [
  { id: 'google', name: 'Google Calendar', enabled: false }, { id: 'outlook', name: 'Outlook', enabled: false }, { id: 'notion', name: 'Notion', enabled: false }, { id: 'trello', name: 'Trello', enabled: false },
]
