export type AppLanguage = 'fr' | 'en'

const financeCategories: Record<string, [string, string]> = {
  Logement: ['Logement', 'Housing'],
  Housing: ['Logement', 'Housing'],
  Alimentation: ['Alimentation', 'Groceries'],
  Groceries: ['Alimentation', 'Groceries'],
  Transport: ['Transport', 'Transport'],
  Loisirs: ['Loisirs', 'Leisure'],
  Leisure: ['Loisirs', 'Leisure'],
  Santé: ['Santé', 'Health'],
  Health: ['Santé', 'Health'],
  Services: ['Services', 'Services'],
  Revenus: ['Revenus', 'Income'],
  Income: ['Revenus', 'Income'],
  Freelance: ['Freelance', 'Freelance'],
  Divers: ['Divers', 'Other'],
  Other: ['Divers', 'Other'],
}

const savingsTitles: Record<string, [string, string]> = {
  'Fonds d’urgence': ['Fonds d’urgence', 'Emergency fund'],
  'Emergency fund': ['Fonds d’urgence', 'Emergency fund'],
  'Nouveau MacBook': ['Nouveau MacBook', 'New MacBook'],
  'New MacBook': ['Nouveau MacBook', 'New MacBook'],
  'Voyage au Japon': ['Voyage au Japon', 'Trip to Japan'],
  'Trip to Japan': ['Voyage au Japon', 'Trip to Japan'],
}

const investmentTypes: Record<string, [string, string]> = {
  Actions: ['Actions', 'Stocks'],
  Stocks: ['Actions', 'Stocks'],
  Crypto: ['Crypto', 'Crypto'],
  Immobilier: ['Immobilier', 'Real estate'],
  'Real estate': ['Immobilier', 'Real estate'],
}

function localized(value: string, language: AppLanguage, dictionary: Record<string, [string, string]>) {
  const pair = dictionary[value]
  return pair ? pair[language === 'en' ? 1 : 0] : value
}

export const localizeFinanceCategory = (value: string, language: AppLanguage) => localized(value, language, financeCategories)
export const localizeSavingsTitle = (value: string, language: AppLanguage) => localized(value, language, savingsTitles)
export const localizeInvestmentType = (value: string, language: AppLanguage) => localized(value, language, investmentTypes)
