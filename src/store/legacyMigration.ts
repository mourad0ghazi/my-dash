import type {
  Budget, CalendarEvent, ChatMessage, FinanceCoachMessage, FinanceProfile, Goal, Habit, HouseholdMember,
  Investment, JournalEntry, Note, Profile, SavingsGoal, Settings, Task, Transaction,
} from '../types'
import {
  initialBudgets, initialChat, initialEvents, initialFinanceCoach, initialFinanceProfile, initialGoals, initialHabits,
  initialInvestments, initialJournal, initialMembers, initialNotes, initialProfile, initialSavings, initialSettings,
  initialTasks, initialTransactions,
} from '../data/initialData'

type PersistedState = {
  profile?: Profile
  settings?: Settings
  financeProfile?: FinanceProfile
  tasks?: Task[]
  notes?: Note[]
  habits?: Habit[]
  journal?: JournalEntry[]
  goals?: Goal[]
  events?: CalendarEvent[]
  transactions?: Transaction[]
  budgets?: Budget[]
  savings?: SavingsGoal[]
  investments?: Investment[]
  chat?: ChatMessage[]
  members?: HouseholdMember[]
  financeCoach?: FinanceCoachMessage[]
}

// Only fingerprints are shipped. They let an older workspace discard untouched
// starter rows without embedding the former profile or demonstration copy again.
const profileFingerprints = {
  name: 'f3e603704d2cc15a8462e50e67ee583f6068c4f7a897462d0ce2323d93953d39',
  email: '8a814bcc55a8f363065eea128f63a520d518352d868b1253d4f5110aaa9ea8dd',
  bio: '65d1d384747c7d0b460778c00bc50c5d1fef9d98b27bf79c9e5ed05f01759fe5',
  phone: '78be8ea9501cac7a161177663ca75c38486379e9b68374dd3c35eb2e5d67a6a9',
  birthDate: 'c34b2d698d13aaeaa9ef1a2eb651199f678745acdc5536aace6a1896252fc7e8',
  city: '2153e0694067b46839b7375f294d6870a80ad9d55651ce34df626cca85793299',
}

const taskFingerprints: Record<string, string> = {
  'task-1': '168d6ef941a1b929583aa009ac2d188a9c48a4373a7582a1d7de82bcf2cd5e30',
  'task-2': '20bb69c57bb4aa52d992c828731448563f8d9443b16122d079077539998a5977',
  'task-3': '316572ba8453565b26e01fecf1e13eb401bd68c406819befcebe2aae415e8281',
  'task-4': '3cab6d72dc7228178c6372fd44ae61ec62ed5bd644be84557f1361d2824893d7',
  'task-5': '77bdf780351ed1c941942bcff0b7af5c47fd18fe85d5d924b73f39db6be970dc',
}
const noteFingerprints: Record<string, string> = {
  'note-1': '55ba6e6d35544055ddd3e4d010010797da218e670a5025c4726526f20a1ab525',
  'note-2': '25a7901cb52d5f2d2167c824a99b8ae51a0347021e74fdc6053c9c29e7741ed6',
  'note-3': '8d34a7bf9f0f69f8fefbbeea09e77f83132e54a79218bf55126a6c91d8ed993e',
}
const habitFingerprints: Record<string, string> = {
  'habit-1': '39b81081c4ede31ef9f04162615281cb72c329d82386b02556f8de5579feab79',
  'habit-2': '6528c468259a96c9a58e7bfa0159b0e91df862dddb11b25fd582cb463eea0f2f',
  'habit-3': '5f13f9b5b6a78ec56989caabf98f156a4a2ec09ddfdfee073ac289ae48529c54',
  'habit-4': '12eda5c78dd5cac559027e284dd9db1b565f11d681f50671129999295383be44',
}
const journalFingerprints: Record<string, string> = {
  'journal-1': 'b9d771c3a1a4e00deb766260c8cc6a0210e496caa7538d79cf1a6885e5319ff1',
}
const goalFingerprints: Record<string, string> = {
  'goal-1': '0c125e24999e520fb571518ec585d0f54813b9e56a9d461a8b6b0d6708da01e1',
  'goal-2': '21cae27be7940e7143f5f6f26edaa444a9c8d4b873e2ebb274d747e50d9a8e65',
}
const eventFingerprints: Record<string, string> = {
  'event-1': '64d446e27a5645bd6a97818a593031ef27dee511a3c1dcb89f5f654cc0ed0b77',
  'event-2': '49dd23f38c7d55d39e36c88a2e4dfd30c82d7727df3df07b577cfbe541f72212',
  'event-3': 'fb9543e5178d8ba89b258bca9e26422c4c151721e5a2f497018652a6094fef2e',
}
const transactionFingerprints: Record<string, string> = {
  'tr-1': '01c4402bf0d2f098a8ffd938d38e829cf9027ef11ff55454f70b14da7638fcd4',
  'tr-2': 'ceb677f9327920c28341eae25fc74d592bda3fc3e1b2008f64dd2cb02ff2dc4e',
  'tr-3': '63f591818fefdfda88aa7b5c1d06e41d2895d4286c134fac488bcabbe46ea7d3',
  'tr-4': '5039cfef44f79f7b452a7efb1052e01b1842580780675a28f11cade7a106fa3f',
  'tr-5': '3343f56e0ef284b1075a859d8edaa3c09b0e86eab0772512aaaf719da760e057',
  'tr-6': '2dddd736418f3ef37262e8bc56300438624d943ae29748d9ec392ddcae3e3d5c',
  'tr-7': '5f1e03bf6899ed3b47fc2960d012a4dd6c713da5d9425fee1dbde3de73731795',
  'tr-8': '7a3fbe8a93696e99c311989b1e57133e5f88f3ab89aa85ef4c6ffb6713056911',
  'hist-in-0': '3e71591d8c9d621b8e837fa060f56749d9792468ded3bfef9853ac022d63b601',
  'hist-out-0': '26e14bd8d4290eab0ef66240bc593137bc842935a38ca9765df4d3bf133a187d',
  'hist-in-1': 'b7d6dd70f7f297c5a34ec5d2e306b1e8ede9928e1d89821a80b2ef6501d67d29',
  'hist-out-1': 'eeb0b2b4d8c962d90b6144bbe73bad5be682a378f6a08ede2ef5795e6e46afc0',
  'hist-in-2': 'b7abf85e06131786073254a74dcc079b7836b84020fd481d350fbd8ade41617c',
  'hist-out-2': '758fa076d2de33a32be002736b154caa34736d1970d0a7e5f830f7038abfc3dc',
  'hist-in-3': '894bc1c013bbc3723b43df4b68b5f983ebb2e04316ecddb61308cb46126eee92',
  'hist-out-3': '3f8b6822015e6d9e9d415dea0b45a3405a3b944687a0baad0569561e60250a99',
  'hist-in-4': '829b1ae74b9debd15fb5c24642b780d1deb1362b8f13615ea84805ff402a755c',
  'hist-out-4': '34d447179a470cc5382e22c0948c14c20f874b78cdc874b2fd97f0d577c0c367',
}
const budgetFingerprints: Record<string, string> = {
  b1: 'cef888ea94e9c6155a3ad22d4be7aa21525942de0c54bf0e14456dd5015afae8',
  b2: '983a87a7c482bdce9973abe3f2c541369c8778ad387a0593d57081b7b375d4c7',
  b3: '475861469e972d4f5d6eb7e10520f90c5457a89057b2605b1120af558dba7485',
  b4: '4092fb68b96bb95bc5d123a2f9c07aaf368ec71853c4212ee1d241568dbea1be',
  b5: '5222fcc7cff5427e2e1a2ab725f1f0a14cbb494a0d3fd469e9cda0f63c6e7dfb',
  b6: 'effa05c4ec71aae1211b0ff3eca7a1c609ab09499243da8c0d8df1fa9a80899b',
}
const savingsFingerprints: Record<string, string> = {
  'save-1': '04f78d0ca98daed44135c513dfce750c702e443d6ad7aaf5d0f8733bf86b68fb',
  'save-2': '09b8744804ba601e2be1a6adfd34179dec9c9a3b6e1077c51c5f538008c4b55d',
  'save-3': '644f8b9455d5db92e79f1ddaa005ca8a91ee9faef7e60c915c3f47fec21f250e',
}
const investmentFingerprints: Record<string, string> = {
  'inv-1': 'c95b96ad16d089d76f11178878cc16deb8ef20c86e396a5727532e24220a77db',
  'inv-2': '391bae049ae90ee17dd1e7c09f95414f80ec9defc3a6153b77a89a49645ac8a0',
  'inv-3': '8cb84a0d3e02d95fbbf42e61267950dfee6215e40e5c955aab7e39bda5d9141d',
}
const chatFingerprints: Record<string, string> = {
  welcome: '679f519156d22868103014c96175ae118ec92ab7458565db55f84dc5787e7d8e',
}
const memberFingerprints: Record<string, string> = {
  'member-1': '53fa3de194d1167471573192f4ef198f69d83234819aa352267a703f019e202b',
}
const financeCoachFingerprints: Record<string, string> = {
  'finance-coach-welcome': 'fc614be9c35f8700702d6c8a7d846b03387aa8cabc8879ab49aca153ed795b4b',
}
const financeProfileFingerprint = '59378dfe359a60b21afcf98439fdca999fadec01c34531b8eadc3c6a1989480a'
const legacyTrueFingerprint = 'b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b'
const legacyDailyFingerprint = 'fa6a92cf80cf218ed717b3cc3a405ffda3fdf6a983d72fed1bdd113622fea03d'
const legacyCoachTimeFingerprint = '805883f1ab872f7bca7ce872bb5c92654c5642a2dee780ae6a1b4d38bc5299ee'

function fingerprint(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const bitLength = bytes.length * 8
  const size = Math.ceil((bytes.length + 9) / 64) * 64
  const data = new Uint8Array(size)
  data.set(bytes)
  data[bytes.length] = 0x80
  const view = new DataView(data.buffer)
  view.setUint32(size - 8, Math.floor(bitLength / 0x100000000), false)
  view.setUint32(size - 4, bitLength >>> 0, false)
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
  const words = new Uint32Array(64)
  const rotate = (value: number, count: number) => (value >>> count) | (value << (32 - count))
  for (let offset = 0; offset < size; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false)
    for (let index = 16; index < 64; index += 1) {
      const first = rotate(words[index - 15], 7) ^ rotate(words[index - 15], 18) ^ (words[index - 15] >>> 3)
      const second = rotate(words[index - 2], 17) ^ rotate(words[index - 2], 19) ^ (words[index - 2] >>> 10)
      words[index] = (words[index - 16] + first + words[index - 7] + second) >>> 0
    }
    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const sigmaOne = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)
      const choice = (e & f) ^ (~e & g)
      const first = (h + sigmaOne + choice + constants[index] + words[index]) >>> 0
      const sigmaZero = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const second = (sigmaZero + majority) >>> 0
      h = g; g = f; f = e; e = (d + first) >>> 0; d = c; c = b; b = a; a = (first + second) >>> 0
    }
    hash[0] = (hash[0] + a) >>> 0; hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0; hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0; hash[5] = (hash[5] + f) >>> 0
    hash[6] = (hash[6] + g) >>> 0; hash[7] = (hash[7] + h) >>> 0
  }
  return hash.map(value => value.toString(16).padStart(8, '0')).join('')
}

const dateDay = (date: string) => Number(date.slice(8, 10))
const dateDistance = (first: string, second: string) => Math.round((Date.parse(first) - Date.parse(second)) / 86400000)
const normalizedHistory = (history: Record<string, boolean>) => {
  const entries = Object.entries(history).sort(([left], [right]) => left.localeCompare(right))
  if (!entries.length) return []
  const latest = Date.parse(entries[entries.length - 1][0])
  return entries.map(([date, value]) => [Math.round((Date.parse(date) - latest) / 86400000), value])
}
const unchanged = (id: string, value: unknown, signatures: Record<string, string>) => Boolean(signatures[id]) && fingerprint(value) === signatures[id]

function cleanProfile(profile: Profile | undefined) {
  if (!profile) return initialProfile
  return {
    ...profile,
    name: fingerprint(profile.name) === profileFingerprints.name ? '' : profile.name,
    email: fingerprint(profile.email) === profileFingerprints.email ? '' : profile.email,
    bio: fingerprint(profile.bio) === profileFingerprints.bio ? '' : profile.bio,
    phone: fingerprint(profile.phone) === profileFingerprints.phone ? '' : profile.phone,
    birthDate: fingerprint(profile.birthDate) === profileFingerprints.birthDate ? '' : profile.birthDate,
    city: fingerprint(profile.city) === profileFingerprints.city ? '' : profile.city,
  }
}

function cleanSettings(settings: Settings | undefined) {
  if (!settings) return initialSettings
  return {
    ...settings,
    parallax: fingerprint(settings.parallax) === legacyTrueFingerprint ? false : settings.parallax,
    notifications: fingerprint(settings.notifications) === legacyTrueFingerprint ? false : settings.notifications,
    budgetAlerts: fingerprint(settings.budgetAlerts) === legacyTrueFingerprint ? false : settings.budgetAlerts,
    coachEnabled: fingerprint(settings.coachEnabled) === legacyTrueFingerprint ? false : settings.coachEnabled,
    coachFrequency: fingerprint(settings.coachFrequency) === legacyDailyFingerprint ? 'never' : settings.coachFrequency,
    coachTime: fingerprint(settings.coachTime) === legacyCoachTimeFingerprint ? '' : settings.coachTime,
    weatherCity: fingerprint(settings.weatherCity) === profileFingerprints.city ? '' : settings.weatherCity,
    notificationEmail: fingerprint(settings.notificationEmail) === profileFingerprints.email ? '' : settings.notificationEmail,
    emailBudgetAlerts: fingerprint(settings.emailBudgetAlerts) === legacyTrueFingerprint ? false : settings.emailBudgetAlerts,
    emailReports: fingerprint(settings.emailReports) === legacyTrueFingerprint ? false : settings.emailReports,
  } satisfies Settings
}

const financeProfileValues = (profile: FinanceProfile) => [
  profile.employment, profile.monthlyIncome, profile.irregularIncome, profile.incomeStability, profile.housing, profile.food,
  profile.transport, profile.utilities, profile.healthInsurance, profile.subscriptions, profile.leisure, profile.shopping,
  profile.debtPayments, profile.debtTotal, profile.dependents, profile.familySupport, profile.emergencySavings,
  profile.budgetFrequency, profile.impulseFrequency, profile.moneyStress, profile.paydayBehavior, profile.priorities,
  profile.primaryGoal, profile.goalAmount, profile.goalDeadline, profile.dreamProject, profile.willingToReduce,
  profile.biggestObstacle, profile.financialNote,
]

export function stripLegacySeedData(persisted: unknown): PersistedState {
  if (!persisted || typeof persisted !== 'object') return persisted as PersistedState
  const state = persisted as PersistedState
  return {
    ...state,
    profile: cleanProfile(state.profile),
    settings: cleanSettings(state.settings),
    financeProfile: state.financeProfile && fingerprint(financeProfileValues(state.financeProfile)) !== financeProfileFingerprint ? state.financeProfile : initialFinanceProfile,
    tasks: (state.tasks ?? initialTasks).filter(item => !unchanged(item.id, [item.id, item.title, item.status, item.priority, item.category, item.tags, item.subtasks.map(part => [part.id, part.title, part.done]), dateDistance(item.dueDate, item.createdAt)], taskFingerprints)),
    notes: (state.notes ?? initialNotes).filter(item => !unchanged(item.id, [item.id, item.title, item.content, item.pinned, item.tags], noteFingerprints)),
    habits: (state.habits ?? initialHabits).filter(item => !unchanged(item.id, [item.id, item.name, item.icon, item.bestStreak, normalizedHistory(item.done), normalizedHistory(item.missed)], habitFingerprints)),
    journal: (state.journal ?? initialJournal).filter(item => !unchanged(item.id, [item.id, item.mood, item.content, item.tags], journalFingerprints)),
    goals: (state.goals ?? initialGoals).filter(item => !unchanged(item.id, [item.id, item.title, item.category, item.progress, item.target, item.unit, item.milestones.map(part => [part.id, part.title, part.done]), dateDay(item.dueDate)], goalFingerprints)),
    events: (state.events ?? initialEvents).filter(item => !unchanged(item.id, [item.id, item.title, item.time, item.color], eventFingerprints)),
    transactions: (state.transactions ?? initialTransactions).filter(item => !unchanged(item.id, [item.id, item.title, item.amount, item.type, item.category, dateDay(item.date)], transactionFingerprints)),
    budgets: (state.budgets ?? initialBudgets).filter(item => !unchanged(item.id, [item.id, item.category, item.planned, item.spent, item.icon], budgetFingerprints)),
    savings: (state.savings ?? initialSavings).filter(item => !unchanged(item.id, [item.id, item.title, item.current, item.target, item.icon, dateDay(item.dueDate)], savingsFingerprints)),
    investments: (state.investments ?? initialInvestments).filter(item => !unchanged(item.id, [item.id, item.name, item.symbol, item.type, item.value, item.change], investmentFingerprints)),
    chat: (state.chat ?? initialChat).filter(item => !unchanged(item.id, [item.id, item.role, item.text], chatFingerprints)),
    members: (state.members ?? initialMembers).filter(item => !unchanged(item.id, [item.id, item.name, item.role, item.initials], memberFingerprints)),
    financeCoach: (state.financeCoach ?? initialFinanceCoach).filter(item => !unchanged(item.id, [item.id, item.role, item.text], financeCoachFingerprints)),
  }
}
