export type PageId = 'dashboard' | 'finances' | 'personal' | 'features' | 'settings'
export type ThemeMode = 'light' | 'dark' | 'auto'
export type Density = 'compact' | 'comfortable' | 'spacious'
export type Accent = 'smoke' | 'sage' | 'slate' | 'terracotta' | 'graphite'
export type TaskStatus = 'todo' | 'doing' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TransactionType = 'income' | 'expense'

export interface Profile {
  name: string
  email: string
  bio: string
  phone: string
  birthDate: string
  city: string
  avatar?: string
}

export interface Settings {
  theme: ThemeMode
  accent: Accent
  density: Density
  language: 'fr' | 'en'
  currency: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  hour12: boolean
  timezone: string
  decimalSeparator: ',' | '.'
  firstDay: 0 | 1
  animations: boolean
  smoke: boolean
  parallax: boolean
  notifications: boolean
  budgetAlerts: boolean
  coachEnabled: boolean
  coachFrequency: 'never' | 'daily' | 'weekly'
  coachTime: string
  hideAmounts: boolean
  pin: string
  journalLocked: boolean
  weatherCity: string
}

export interface SubTask { id: string; title: string; done: boolean }
export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  category: string
  tags: string[]
  subtasks: SubTask[]
  createdAt: string
}
export interface Note { id: string; title: string; content: string; pinned: boolean; tags: string[]; updatedAt: string }
export interface Habit { id: string; name: string; icon: string; done: Record<string, boolean>; missed: Record<string, boolean>; bestStreak: number }
export interface JournalEntry { id: string; date: string; mood: string; content: string; tags: string[] }
export interface Milestone { id: string; title: string; done: boolean }
export interface Goal { id: string; title: string; category: string; progress: number; target: number; unit: string; dueDate: string; milestones: Milestone[] }
export interface CalendarEvent { id: string; title: string; date: string; time: string; color: string }

export interface Transaction { id: string; title: string; amount: number; type: TransactionType; category: string; date: string }
export interface Budget { id: string; category: string; planned: number; spent: number; icon: string }
export interface SavingsGoal { id: string; title: string; current: number; target: number; dueDate: string; icon: string }
export interface Investment { id: string; name: string; symbol: string; type: string; value: number; change: number }

export interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string; createdAt: string }
export interface HouseholdMember { id: string; name: string; role: string; initials: string }
export interface Integration { id: string; name: string; enabled: boolean }

export interface GridItem { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }
export type StoredLayouts = Record<string, GridItem[]>

export interface ToastData { id: string; title: string; message?: string; tone?: 'default' | 'success' | 'warning' | 'danger' }
