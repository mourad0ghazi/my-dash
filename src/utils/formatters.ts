import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'

export { currency, compactCurrency } from './numberFormatters'
export { todayISO, uid } from './core'
export { downloadFile, toCSV } from './fileUtils'

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
