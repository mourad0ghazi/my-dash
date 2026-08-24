import { AlarmClock, Banknote, BookOpen, Brain, CalendarDays, CheckSquare, CircleDollarSign, CloudSun, Goal, Landmark, NotebookPen, PiggyBank, PieChart, ReceiptText, Sparkles, StickyNote } from 'lucide-react'

export const moduleRegistry = [
  { id: 'clock', label: 'Horloge', labelEn: 'Clock', icon: AlarmClock },
  { id: 'weather', label: 'Météo', labelEn: 'Weather', icon: CloudSun },
  { id: 'pomodoro', label: 'Pomodoro', labelEn: 'Pomodoro', icon: Brain },
  { id: 'savings', label: 'Épargne', labelEn: 'Savings', icon: PiggyBank },
  { id: 'finance', label: 'Résumé financier', labelEn: 'Financial summary', icon: Banknote },
  { id: 'expenses', label: 'Répartition', labelEn: 'Allocation', icon: PieChart },
  { id: 'tasks', label: 'Tâches', labelEn: 'Tasks', icon: CheckSquare },
  { id: 'habits', label: 'Habitudes', labelEn: 'Habits', icon: Sparkles },
  { id: 'calendar', label: 'Calendrier', labelEn: 'Calendar', icon: CalendarDays },
  { id: 'budget', label: 'Budget', labelEn: 'Budget', icon: CircleDollarSign },
  { id: 'transactions', label: 'Transactions', labelEn: 'Transactions', icon: ReceiptText },
  { id: 'notes', label: 'Notes', labelEn: 'Notes', icon: StickyNote },
  { id: 'goals', label: 'Objectifs', labelEn: 'Goals', icon: Goal },
  { id: 'journal', label: 'Journal', labelEn: 'Journal', icon: NotebookPen },
  { id: 'investments', label: 'Investissements', labelEn: 'Investments', icon: Landmark },
  { id: 'loan', label: 'Calculateur prêt', labelEn: 'Loan calculator', icon: BookOpen },
]
