function numberLocale(language: string, decimalSeparator?: ',' | '.') {
  if (decimalSeparator === ',') return 'fr-FR'
  if (decimalSeparator === '.') return 'en-US'
  return language === 'fr' ? 'fr-FR' : 'en-US'
}

export function currency(value: number, code = 'MAD', language = 'fr', hide = false, decimalSeparator?: ',' | '.') {
  if (hide) return '•••••'
  const safeValue = Number.isFinite(value) ? value : 0
  const hasDecimals = Math.abs(safeValue % 1) > Number.EPSILON
  return new Intl.NumberFormat(numberLocale(language, decimalSeparator), {
    style: 'currency', currency: code, minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2,
  }).format(safeValue)
}

export function compactCurrency(value: number, code = 'MAD', hide = false, language = 'fr', decimalSeparator?: ',' | '.') {
  if (hide) return '•••'
  return new Intl.NumberFormat(numberLocale(language, decimalSeparator), {
    notation: 'compact', style: 'currency', currency: code, maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0)
}
