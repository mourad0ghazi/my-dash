/** Small dependency-free helpers used while LifeOS is booting. */
export function todayISO(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export function uid(prefix = 'id') {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${random}`
}

export function shortDate(value: string, language = 'fr', dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return value
  const [, year, month, day] = match
  if (dateFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`
  if (dateFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`
  if (dateFormat === 'DD/MM/YYYY') return `${day}/${month}/${year}`
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' }).format(date)
}
