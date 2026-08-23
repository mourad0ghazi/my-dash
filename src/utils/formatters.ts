import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'

export function currency(value: number, code = 'MAD', language = 'fr', hide = false) {
  if (hide) return '•••••'
  return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency', currency: code, maximumFractionDigits: 0,
  }).format(value)
}
export function compactCurrency(value: number, code = 'MAD', hide = false, language = 'fr') {
  if (hide) return '•••'
  return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { notation: 'compact', style: 'currency', currency: code, maximumFractionDigits: 1 }).format(value)
}
export function dateLabel(value: string, pattern = 'dd MMM yyyy', language = 'fr') {
  try { return format(parseISO(value), pattern, { locale: language === 'fr' ? fr : enUS }) } catch { return value }
}
export function relativeDate(value: string, language = 'fr') {
  try { return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: language === 'fr' ? fr : enUS }) } catch { return value }
}
export function todayISO(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}
export function uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
export function downloadFile(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [keys.map(escape).join(','), ...rows.map(row => keys.map(key => escape(row[key])).join(','))].join('\n')
}
