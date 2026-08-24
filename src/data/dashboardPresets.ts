import type { Accent, DashboardPresetId, Density } from '../types'

export interface DashboardPreset {
  id: DashboardPresetId
  name: { fr: string; en: string }
  description: { fr: string; en: string }
  format: { fr: string; en: string }
  priority: string[]
  visible: string[]
  density: Density
  accent: Accent
  sizes: Partial<Record<string, { w: number; h: number }>>
}

export const dashboardPresets: DashboardPreset[] = [
  {
    id: 'essential',
    name: { fr: 'Essentiel équilibré', en: 'Balanced essentials' },
    description: { fr: 'Une vue calme sur votre journée, votre argent et vos priorités.', en: 'A calm view of your day, money and priorities.' },
    format: { fr: '8 cartes · format confortable', en: '8 cards · comfortable layout' },
    priority: ['finance', 'tasks', 'calendar', 'expenses', 'habits', 'savings', 'weather', 'clock'],
    visible: ['finance', 'tasks', 'calendar', 'expenses', 'habits', 'savings', 'weather', 'clock'],
    density: 'comfortable', accent: 'smoke',
    sizes: { finance: { w: 6, h: 4 }, tasks: { w: 6, h: 5 }, calendar: { w: 6, h: 5 }, expenses: { w: 6, h: 4 } },
  },
  {
    id: 'finance',
    name: { fr: 'Pilotage financier', en: 'Financial control' },
    description: { fr: 'Les flux, budgets et placements au premier plan, sans distraction.', en: 'Cash flow, budgets and investments first, without distractions.' },
    format: { fr: '8 cartes · vue dense', en: '8 cards · dense view' },
    priority: ['finance', 'expenses', 'transactions', 'budget', 'savings', 'investments', 'loan', 'clock'],
    visible: ['finance', 'expenses', 'transactions', 'budget', 'savings', 'investments', 'loan', 'clock'],
    density: 'compact', accent: 'sage',
    sizes: { finance: { w: 7, h: 4 }, expenses: { w: 5, h: 4 }, transactions: { w: 7, h: 5 }, budget: { w: 5, h: 5 }, investments: { w: 7, h: 5 } },
  },
  {
    id: 'productivity',
    name: { fr: 'Focus & productivité', en: 'Focus & productivity' },
    description: { fr: 'Tâches, planning et objectifs structurés pour passer à l’action.', en: 'Tasks, planning and goals structured for action.' },
    format: { fr: '8 cartes · rythme compact', en: '8 cards · compact rhythm' },
    priority: ['tasks', 'calendar', 'pomodoro', 'goals', 'notes', 'habits', 'clock', 'weather'],
    visible: ['tasks', 'calendar', 'pomodoro', 'goals', 'notes', 'habits', 'clock', 'weather'],
    density: 'compact', accent: 'slate',
    sizes: { tasks: { w: 7, h: 6 }, calendar: { w: 5, h: 6 }, pomodoro: { w: 4, h: 4 }, goals: { w: 8, h: 5 }, notes: { w: 8, h: 5 } },
  },
  {
    id: 'wellbeing',
    name: { fr: 'Bien-être personnel', en: 'Personal wellbeing' },
    description: { fr: 'Plus d’espace pour vos habitudes, votre journal et vos progrès.', en: 'More space for habits, journaling and personal progress.' },
    format: { fr: '8 cartes · format aéré', en: '8 cards · spacious layout' },
    priority: ['habits', 'journal', 'goals', 'calendar', 'weather', 'notes', 'clock', 'pomodoro'],
    visible: ['habits', 'journal', 'goals', 'calendar', 'weather', 'notes', 'clock', 'pomodoro'],
    density: 'spacious', accent: 'terracotta',
    sizes: { habits: { w: 6, h: 5 }, journal: { w: 6, h: 5 }, goals: { w: 7, h: 5 }, calendar: { w: 5, h: 5 }, notes: { w: 8, h: 5 } },
  },
]

export function getDashboardPreset(id: DashboardPresetId) {
  return dashboardPresets.find(preset => preset.id === id) ?? dashboardPresets[0]
}
