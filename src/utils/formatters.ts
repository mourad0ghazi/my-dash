import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'

function numberLocale(language: string, decimalSeparator?: ',' | '.') {
  if (decimalSeparator === ',') return 'fr-FR'
  if (decimalSeparator === '.') return 'en-US'
  return language === 'fr' ? 'fr-FR' : 'en-US'
}

export function currency(value: number, code = 'MAD', language = 'fr', hide = false, decimalSeparator?: ',' | '.') {
  if (hide) return '•••••'
  const hasDecimals = Math.abs(value % 1) > Number.EPSILON
  return new Intl.NumberFormat(numberLocale(language, decimalSeparator), {
    style: 'currency', currency: code, minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2,
  }).format(value)
}
export function compactCurrency(value: number, code = 'MAD', hide = false, language = 'fr', decimalSeparator?: ',' | '.') {
  if (hide) return '•••'
  return new Intl.NumberFormat(numberLocale(language, decimalSeparator), { notation: 'compact', style: 'currency', currency: code, maximumFractionDigits: 1 }).format(value)
}
export function dateLabel(value: string, pattern = 'dd MMM yyyy', language = 'fr', dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') {
  const preferredPattern = dateFormat === 'MM/DD/YYYY' ? 'MM/dd/yyyy' : dateFormat === 'YYYY-MM-DD' ? 'yyyy-MM-dd' : dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : pattern
  try { return format(parseISO(value), preferredPattern, { locale: language === 'fr' ? fr : enUS }) } catch { return value }
}
export function timeLabel(value: string, language = 'fr', hour12 = false) {
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12 }).format(date)
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
