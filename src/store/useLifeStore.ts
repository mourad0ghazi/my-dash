import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Budget, CalendarEvent, ChatMessage, Goal, Habit, HouseholdMember, Integration, Investment, JournalEntry, Note, Profile, SavingsGoal, Settings, StoredLayouts, Task, TaskStatus, ToastData, Transaction } from '../types'
import {
  initialBudgets, initialChat, initialEvents, initialGoals, initialHabits, initialIntegrations, initialInvestments, initialJournal,
  initialLayouts, initialMembers, initialNotes, initialProfile, initialSavings, initialSettings, initialTasks, initialTransactions, initialVisible,
} from '../data/initialData'
import { uid } from '../utils/formatters'

type SettingsPatch = Partial<Settings>
interface LifeStore {
  profile: Profile; settings: Settings
  tasks: Task[]; notes: Note[]; habits: Habit[]; journal: JournalEntry[]; goals: Goal[]; events: CalendarEvent[]
  transactions: Transaction[]; budgets: Budget[]; savings: SavingsGoal[]; investments: Investment[]
  layouts: StoredLayouts; visibleWidgets: Record<string, boolean>; editMode: boolean
  chat: ChatMessage[]; chatOpen: boolean; chatTyping: boolean; unread: number
  members: HouseholdMember[]; integrations: Integration[]; bankConnected: boolean; apiKey: string
  toasts: ToastData[]
  updateProfile: (patch: Partial<Profile>) => void; updateSettings: (patch: SettingsPatch) => void
  setLayouts: (layouts: StoredLayouts) => void; toggleWidget: (id: string) => void; showAllWidgets: () => void; setEditMode: (value: boolean) => void; resetLayout: () => void
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void; updateTask: (id: string, patch: Partial<Task>) => void; deleteTask: (id: string) => void; setTaskStatus: (id: string, status: TaskStatus) => void; reorderTasks: (tasks: Task[]) => void
  addNote: () => string; updateNote: (id: string, patch: Partial<Note>) => void; deleteNote: (id: string) => void
  toggleHabit: (id: string, date: string) => void
  saveJournal: (date: string, mood: string, content: string) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void; deleteEvent: (id: string) => void
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void; updateTransaction: (id: string, patch: Partial<Transaction>) => void; deleteTransaction: (id: string) => void; updateBudget: (id: string, patch: Partial<Budget>) => void
  contributeSavings: (id: string, amount: number) => void
  setChatOpen: (value: boolean) => void; setChatTyping: (value: boolean) => void; pushChat: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void; clearChat: () => void; setUnread: (value: number) => void
  addMember: (name: string, role: string) => void; toggleIntegration: (id: string) => void; connectBank: () => void; generateApiKey: () => void
  pushToast: (toast: Omit<ToastData, 'id'>) => void; removeToast: (id: string) => void
  resetAll: () => void
}

const copy = (state: Pick<LifeStore, 'settings'>, french: string, english: string) => state.settings.language === 'en' ? english : french

const freshState = () => ({
  profile: { ...initialProfile }, settings: { ...initialSettings }, tasks: [...initialTasks], notes: [...initialNotes], habits: [...initialHabits], journal: [...initialJournal], goals: [...initialGoals], events: [...initialEvents],
  transactions: [...initialTransactions], budgets: [...initialBudgets], savings: [...initialSavings], investments: [...initialInvestments],
  layouts: structuredClone(initialLayouts), visibleWidgets: { ...initialVisible }, editMode: false,
  chat: [...initialChat], chatOpen: false, chatTyping: false, unread: 0, members: [...initialMembers], integrations: [...initialIntegrations], bankConnected: false, apiKey: '', toasts: [],
})

export const useLifeStore = create<LifeStore>()(persist((set, get) => ({
  ...freshState(),
  updateProfile: patch => set(state => ({ profile: { ...state.profile, ...patch } })),
  updateSettings: patch => set(state => ({ settings: { ...state.settings, ...patch } })),
  setLayouts: layouts => set({ layouts }),
  toggleWidget: id => set(state => ({ visibleWidgets: { ...state.visibleWidgets, [id]: !state.visibleWidgets[id] } })),
  showAllWidgets: () => set({ visibleWidgets: { ...initialVisible } }),
  setEditMode: editMode => set({ editMode }),
  resetLayout: () => { set({ layouts: structuredClone(initialLayouts), visibleWidgets: { ...initialVisible } }); get().pushToast({ title: copy(get(), 'Disposition réinitialisée', 'Layout reset'), tone: 'success' }) },
  addTask: task => { set(state => ({ tasks: [{ ...task, id: uid('task'), createdAt: new Date().toISOString() }, ...state.tasks] })); get().pushToast({ title: copy(get(), 'Tâche ajoutée', 'Task added'), tone: 'success' }) },
  updateTask: (id, patch) => set(state => ({ tasks: state.tasks.map(task => task.id === id ? { ...task, ...patch } : task) })),
  deleteTask: id => set(state => ({ tasks: state.tasks.filter(task => task.id !== id) })),
  setTaskStatus: (id, status) => set(state => ({ tasks: state.tasks.map(task => task.id === id ? { ...task, status } : task) })),
  reorderTasks: tasks => set({ tasks }),
  addNote: () => { const id = uid('note'); set(state => ({ notes: [{ id, title: copy(state, 'Nouvelle note', 'New note'), content: '', pinned: false, tags: [], updatedAt: new Date().toISOString() }, ...state.notes] })); return id },
  updateNote: (id, patch) => set(state => ({ notes: state.notes.map(note => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note) })),
  deleteNote: id => set(state => ({ notes: state.notes.filter(note => note.id !== id) })),
  toggleHabit: (id, date) => set(state => ({ habits: state.habits.map(habit => {
    if (habit.id !== id) return habit
    const done = { ...habit.done }; const missed = { ...habit.missed }
    if (!done[date] && !missed[date]) done[date] = true
    else if (done[date]) { delete done[date]; missed[date] = true }
    else delete missed[date]
    return { ...habit, done, missed }
  }) })),
  saveJournal: (date, mood, content) => set(state => {
    const found = state.journal.find(entry => entry.date === date)
    return { journal: found ? state.journal.map(entry => entry.date === date ? { ...entry, mood, content } : entry) : [{ id: uid('journal'), date, mood, content, tags: [] }, ...state.journal] }
  }),
  updateGoal: (id, patch) => set(state => ({ goals: state.goals.map(goal => goal.id === id ? { ...goal, ...patch } : goal) })),
  addEvent: event => { set(state => ({ events: [...state.events, { ...event, id: uid('event') }] })); get().pushToast({ title: copy(get(), 'Événement ajouté', 'Event added'), tone: 'success' }) },
  deleteEvent: id => set(state => ({ events: state.events.filter(event => event.id !== id) })),
  addTransaction: transaction => {
    set(state => ({
      transactions: [{ ...transaction, id: uid('transaction') }, ...state.transactions],
      budgets: transaction.type === 'expense' ? state.budgets.map(budget => budget.category === transaction.category ? { ...budget, spent: budget.spent + transaction.amount } : budget) : state.budgets,
    }))
    get().pushToast({ title: copy(get(), 'Transaction enregistrée', 'Transaction saved'), message: `${transaction.title} · ${transaction.amount}`, tone: 'success' })
  },
  updateTransaction: (id, patch) => set(state => {
    const previous = state.transactions.find(transaction => transaction.id === id)
    if (!previous) return state
    const next = { ...previous, ...patch }
    const budgets = state.budgets.map(budget => {
      let spent = budget.spent
      if (previous.type === 'expense' && budget.category === previous.category) spent -= previous.amount
      if (next.type === 'expense' && budget.category === next.category) spent += next.amount
      return { ...budget, spent: Math.max(0, spent) }
    })
    return { transactions: state.transactions.map(transaction => transaction.id === id ? next : transaction), budgets }
  }),
  deleteTransaction: id => set(state => {
    const removed = state.transactions.find(transaction => transaction.id === id)
    return {
      transactions: state.transactions.filter(transaction => transaction.id !== id),
      budgets: removed?.type === 'expense' ? state.budgets.map(budget => budget.category === removed.category ? { ...budget, spent: Math.max(0, budget.spent - removed.amount) } : budget) : state.budgets,
    }
  }),
  updateBudget: (id, patch) => set(state => ({ budgets: state.budgets.map(budget => budget.id === id ? { ...budget, ...patch } : budget) })),
  contributeSavings: (id, amount) => { set(state => ({ savings: state.savings.map(goal => goal.id === id ? { ...goal, current: Math.min(goal.target, goal.current + amount) } : goal) })); get().pushToast({ title: copy(get(), 'Épargne mise à jour', 'Savings updated'), message: `+${amount}`, tone: 'success' }) },
  setChatOpen: value => set({ chatOpen: value, unread: value ? 0 : get().unread }),
  setChatTyping: chatTyping => set({ chatTyping }),
  pushChat: message => set(state => ({ chat: [...state.chat, { ...message, id: uid('chat'), createdAt: new Date().toISOString() }] })),
  clearChat: () => set({ chat: [...initialChat] }),
  setUnread: unread => set({ unread }),
  addMember: (name, role) => { set(state => ({ members: [...state.members, { id: uid('member'), name, role, initials: name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() }] })); get().pushToast({ title: copy(get(), 'Membre ajouté', 'Member added'), tone: 'success' }) },
  toggleIntegration: id => set(state => ({ integrations: state.integrations.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item) })),
  connectBank: () => { set(state => ({ bankConnected: !state.bankConnected })); get().pushToast({ title: get().bankConnected ? copy(get(), 'Compte démo connecté', 'Demo account connected') : copy(get(), 'Compte déconnecté', 'Account disconnected'), tone: 'success' }) },
  generateApiKey: () => { const key = `lifeos_${crypto.randomUUID().replaceAll('-', '')}`; set({ apiKey: key }); get().pushToast({ title: copy(get(), 'Clé API locale générée', 'Local API key generated'), tone: 'success' }) },
  pushToast: toast => { const id = uid('toast'); set(state => ({ toasts: [...state.toasts, { ...toast, id }] })); window.setTimeout(() => get().removeToast(id), 3800) },
  removeToast: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
  resetAll: () => set(freshState()),
}), {
  name: 'lifeos:v2:state', version: 2,
  partialize: state => ({
    profile: state.profile, settings: state.settings, tasks: state.tasks, notes: state.notes, habits: state.habits, journal: state.journal, goals: state.goals, events: state.events,
    transactions: state.transactions, budgets: state.budgets, savings: state.savings, investments: state.investments, layouts: state.layouts, visibleWidgets: state.visibleWidgets,
    editMode: state.editMode, chat: state.chat, unread: state.unread, members: state.members, integrations: state.integrations, bankConnected: state.bankConnected, apiKey: state.apiKey,
  }),
}))
