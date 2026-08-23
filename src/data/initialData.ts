import type { Budget, CalendarEvent, ChatMessage, FinanceCoachMessage, FinanceProfile, Goal, Habit, HouseholdMember, Integration, Investment, JournalEntry, Note, Profile, SavingsGoal, Settings, StoredLayouts, Task, Transaction } from '../types'
import { todayISO } from '../utils/formatters'

const monthISO = (offset: number, day: number) => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); d.setDate(Math.min(day, 28)); return d.toISOString().slice(0, 10)
}
const weekHistory = (days: number[]) => Object.fromEntries(days.map(offset => [todayISO(offset), true]))

export const initialProfile: Profile = {
  name: 'Mourad Ghazi', email: 'mourad@lifeos.local', bio: 'Créateur, apprenant et bâtisseur de projets utiles.', phone: '+212 6 00 00 00 00', birthDate: '1994-04-18', city: 'Casablanca',
}
export const initialSettings: Settings = {
  theme: 'light', accent: 'smoke', density: 'comfortable', language: 'fr', currency: 'MAD', dateFormat: 'DD/MM/YYYY', hour12: false,
  timezone: 'Africa/Casablanca', decimalSeparator: ',', firstDay: 1, animations: true, smoke: true, parallax: true, notifications: true,
  budgetAlerts: true, coachEnabled: true, coachFrequency: 'daily', coachTime: '09:00', hideAmounts: false, pin: '', journalLocked: false, weatherCity: 'Casablanca',
  emailNotifications: false, notificationEmail: 'mourad@lifeos.local', emailBudgetAlerts: true, emailReports: true, reportFrequency: 'monthly',
}

export const initialFinanceProfile: FinanceProfile = {
  employment: '', monthlyIncome: 0, irregularIncome: 0, incomeStability: 'stable', housing: 0, food: 0, transport: 0, utilities: 0,
  healthInsurance: 0, subscriptions: 0, leisure: 0, shopping: 0, debtPayments: 0, debtTotal: 0, dependents: 0, familySupport: 0,
  emergencySavings: 0, budgetFrequency: 'sometimes', impulseFrequency: 'sometimes', moneyStress: 5, paydayBehavior: '', priorities: [],
  primaryGoal: '', goalAmount: 0, goalDeadline: '', dreamProject: '', willingToReduce: '', biggestObstacle: '', financialNote: '',
}

export const initialFinanceCoach: FinanceCoachMessage[] = [{
  id: 'finance-coach-welcome', role: 'assistant', createdAt: new Date().toISOString(),
  text: 'Bonjour ! Je suis votre coach financier LifeOS. Ici, aucun jugement et aucun jargon inutile : on regarde vos chiffres, vos priorités et la prochaine action réaliste.',
}]

export const initialTasks: Task[] = [
  { id: 'task-1', title: 'Finaliser la présentation LifeOS', status: 'doing', priority: 'high', dueDate: todayISO(1), category: 'Travail', tags: ['focus'], subtasks: [{ id: 's1', title: 'Relire les slides', done: true }, { id: 's2', title: 'Préparer la démo', done: false }], createdAt: todayISO(-3) },
  { id: 'task-2', title: 'Séance de sport · 45 min', status: 'todo', priority: 'medium', dueDate: todayISO(0), category: 'Santé', tags: ['routine'], subtasks: [], createdAt: todayISO(-2) },
  { id: 'task-3', title: 'Planifier le budget du mois', status: 'todo', priority: 'high', dueDate: todayISO(2), category: 'Finance', tags: ['argent'], subtasks: [], createdAt: todayISO(-1) },
  { id: 'task-4', title: 'Appeler la famille', status: 'done', priority: 'medium', dueDate: todayISO(-1), category: 'Personnel', tags: [], subtasks: [], createdAt: todayISO(-4) },
  { id: 'task-5', title: 'Lire 20 pages', status: 'todo', priority: 'low', dueDate: todayISO(0), category: 'Apprentissage', tags: ['lecture'], subtasks: [], createdAt: todayISO(-1) },
]
export const initialNotes: Note[] = [
  { id: 'note-1', title: 'Idées d’investissement', content: 'Étudier les ETF monde, comparer les frais et construire une stratégie long terme simple.', pinned: true, tags: ['finance'], updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'note-2', title: 'Principes de la semaine', content: 'Créer avant de consommer. Faire une chose importante à la fois. Protéger son énergie.', pinned: false, tags: ['réflexion'], updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'note-3', title: 'Recette rapide', content: 'Pois chiches, tomates, cumin, citron, huile d’olive et herbes fraîches.', pinned: false, tags: ['maison'], updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
]
export const initialHabits: Habit[] = [
  { id: 'habit-1', name: 'Méditation', icon: '◌', done: weekHistory([-6, -5, -4, -3, -2, -1, 0]), missed: {}, bestStreak: 12 },
  { id: 'habit-2', name: 'Lecture', icon: '⌁', done: weekHistory([-6, -5, -3, -2, 0]), missed: {}, bestStreak: 8 },
  { id: 'habit-3', name: 'Sport', icon: '↗', done: weekHistory([-6, -4, -2]), missed: {}, bestStreak: 5 },
  { id: 'habit-4', name: '2L d’eau', icon: '◍', done: weekHistory([-6, -5, -4, -3, -2, -1]), missed: {}, bestStreak: 21 },
]
export const initialJournal: JournalEntry[] = [
  { id: 'journal-1', date: todayISO(-1), mood: '😊', content: 'Une journée calme et productive. Fier d’avoir avancé sur le projet sans me disperser.', tags: ['gratitude', 'progrès'] },
]
export const initialGoals: Goal[] = [
  { id: 'goal-1', title: 'Lire 12 livres cette année', category: 'Apprentissage', progress: 7, target: 12, unit: 'livres', dueDate: monthISO(4, 31), milestones: [{ id: 'm1', title: '6 livres', done: true }, { id: 'm2', title: '9 livres', done: false }] },
  { id: 'goal-2', title: 'Courir un semi-marathon', category: 'Santé', progress: 12, target: 21, unit: 'km', dueDate: monthISO(3, 15), milestones: [{ id: 'm3', title: 'Courir 10 km', done: true }, { id: 'm4', title: 'Courir 15 km', done: false }] },
]
export const initialEvents: CalendarEvent[] = [
  { id: 'event-1', title: 'Revue hebdomadaire', date: todayISO(1), time: '18:00', color: '#66736a' },
  { id: 'event-2', title: 'Dentiste', date: todayISO(3), time: '10:30', color: '#9a6555' },
  { id: 'event-3', title: 'Déjeuner équipe', date: todayISO(5), time: '13:00', color: '#657386' },
]
export const initialTransactions: Transaction[] = [
  { id: 'tr-1', title: 'Salaire', amount: 18500, type: 'income', category: 'Revenus', date: monthISO(0, 2) },
  { id: 'tr-2', title: 'Mission freelance', amount: 4200, type: 'income', category: 'Freelance', date: monthISO(0, 9) },
  { id: 'tr-3', title: 'Loyer', amount: 5200, type: 'expense', category: 'Logement', date: monthISO(0, 3) },
  { id: 'tr-4', title: 'Courses Marjane', amount: 1350, type: 'expense', category: 'Alimentation', date: monthISO(0, 7) },
  { id: 'tr-5', title: 'Transport', amount: 680, type: 'expense', category: 'Transport', date: monthISO(0, 11) },
  { id: 'tr-6', title: 'Restaurants & café', amount: 940, type: 'expense', category: 'Loisirs', date: monthISO(0, 14) },
  { id: 'tr-7', title: 'Mutuelle', amount: 550, type: 'expense', category: 'Santé', date: monthISO(0, 16) },
  { id: 'tr-8', title: 'Abonnements', amount: 390, type: 'expense', category: 'Services', date: monthISO(0, 18) },
  ...[-1, -2, -3, -4, -5].flatMap((offset, index): Transaction[] => [
    { id: `hist-in-${index}`, title: 'Salaire', amount: 17500 + index * 300, type: 'income', category: 'Revenus', date: monthISO(offset, 2) },
    { id: `hist-out-${index}`, title: 'Dépenses mensuelles', amount: 9500 + index * 210, type: 'expense', category: 'Divers', date: monthISO(offset, 15) },
  ]),
]
export const initialBudgets: Budget[] = [
  { id: 'b1', category: 'Logement', planned: 5500, spent: 5200, icon: '⌂' },
  { id: 'b2', category: 'Alimentation', planned: 2200, spent: 1350, icon: '◒' },
  { id: 'b3', category: 'Transport', planned: 1000, spent: 680, icon: '↗' },
  { id: 'b4', category: 'Loisirs', planned: 1200, spent: 940, icon: '✦' },
  { id: 'b5', category: 'Santé', planned: 900, spent: 550, icon: '♡' },
  { id: 'b6', category: 'Services', planned: 500, spent: 390, icon: '⌁' },
]
export const initialSavings: SavingsGoal[] = [
  { id: 'save-1', title: 'Fonds d’urgence', current: 28000, target: 50000, dueDate: monthISO(8, 1), icon: '◈' },
  { id: 'save-2', title: 'Nouveau MacBook', current: 12500, target: 24000, dueDate: monthISO(5, 1), icon: '▣' },
  { id: 'save-3', title: 'Voyage au Japon', current: 9000, target: 30000, dueDate: monthISO(10, 1), icon: '✈' },
]
export const initialInvestments: Investment[] = [
  { id: 'inv-1', name: 'ETF Monde', symbol: 'IWDA', type: 'Actions', value: 32500, change: 8.4 },
  { id: 'inv-2', name: 'Bitcoin', symbol: 'BTC', type: 'Crypto', value: 7800, change: -2.1 },
  { id: 'inv-3', name: 'SCPI Europe', symbol: 'SCPI', type: 'Immobilier', value: 18500, change: 4.7 },
]
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
export const initialChat: ChatMessage[] = [{ id: 'welcome', role: 'assistant', text: 'Bonjour Mourad ! Je suis votre assistant LifeOS. Je peux analyser votre budget, organiser votre journée ou vous aider à garder le cap.', createdAt: new Date().toISOString() }]
export const initialMembers: HouseholdMember[] = [{ id: 'member-1', name: 'Mourad', role: 'Administrateur', initials: 'MG' }]
export const initialIntegrations: Integration[] = [
  { id: 'google', name: 'Google Calendar', enabled: false }, { id: 'outlook', name: 'Outlook', enabled: false }, { id: 'notion', name: 'Notion', enabled: false }, { id: 'trello', name: 'Trello', enabled: false },
]
