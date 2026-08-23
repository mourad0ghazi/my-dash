import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, Sparkles, Trash2, X } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { financialTips, productivityTips, quotes } from '../../data/knowledge'
import { currency } from '../../utils/formatters'
import { localizeFinanceCategory, localizeSavingsTitle } from '../../utils/localization'
import { IconButton } from '../ui/primitives'

const suggestions = {
  fr: ['Quel est mon budget ?', 'Planifie ma journée', 'Un conseil financier', 'Motive-moi'],
  en: ['How is my budget?', 'Plan my day', 'A financial tip', 'Motivate me'],
}
const englishFinancialTips = ['Automate a transfer to savings just after payday.', 'Review recurring subscriptions once a month.', 'Keep an emergency fund covering three to six months.']
const englishProductivityTips = ['Choose one essential task before opening your inbox.', 'Work for 25 focused minutes, then take a short break.', 'Break the next action into a step that takes under ten minutes.']
const englishQuotes = ['Small steps, repeated consistently, create remarkable results.', 'Clarity comes from action, not from waiting.', 'Progress matters more than perfection.']
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
function normalize(text: string) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }
function getReply(input: string) {
  const state = useLifeStore.getState()
  const en = state.settings.language === 'en'
  const q = normalize(input)
  const now = new Date()
  const current = state.transactions.filter(item => { const d = new Date(item.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = current.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expense = current.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const active = state.tasks.filter(task => task.status !== 'done')
  const money = (value: number) => currency(value, state.settings.currency, state.settings.language, state.settings.hideAmounts, state.settings.decimalSeparator)
  const financeTips = en ? englishFinancialTips : financialTips
  const productivity = en ? englishProductivityTips : productivityTips
  const motivation = en ? englishQuotes : quotes

  if (/bonjour|salut|hello|hey|coucou/.test(q)) return en
    ? pick(['Hello! Great to see you. What would you like to improve?', 'Hi! I am ready. Finances, tasks, or goals?', 'Hello! Let us make today clear and useful.'])
    : pick(['Bonjour ! Ravi de vous retrouver. Sur quoi voulez-vous avancer ?', 'Salut ! Je suis prêt. Finances, tâches ou objectifs ?', 'Bonjour ! Faisons de cette journée une journée claire et utile.'])
  if (/budget|left|reste|combien.*mois/.test(q)) {
    const planned = state.budgets.reduce((sum, budget) => sum + budget.planned, 0)
    const spent = state.budgets.reduce((sum, budget) => sum + budget.spent, 0)
    const warning = [...state.budgets].sort((a, b) => b.spent / b.planned - a.spent / a.planned)[0]
    return en
      ? `You have used ${money(spent)} out of ${money(planned)}, or ${Math.round(spent / planned * 100)}% of your budget. The category to watch is ${localizeFinanceCategory(warning.category, state.settings.language)} (${Math.round(warning.spent / warning.planned * 100)}%).`
      : `Vous avez utilisé ${money(spent)} sur ${money(planned)}, soit ${Math.round(spent / planned * 100)} % du budget. La catégorie à surveiller est ${localizeFinanceCategory(warning.category, state.settings.language)} (${Math.round(warning.spent / warning.planned * 100)} %).`
  }
  if (/revenu|salaire|entree|income|salary/.test(q)) return en ? `Your recorded income this month is ${money(income)}. Your balance after expenses is ${money(income - expense)}.` : `Vos revenus enregistrés ce mois atteignent ${money(income)}. Votre solde après dépenses est de ${money(income - expense)}.`
  if (/depense|sortie|expense|spend/.test(q)) return en ? `You have spent ${money(expense)} this month. That represents ${income ? Math.round(expense / income * 100) : 0}% of your income.` : `Vous avez dépensé ${money(expense)} ce mois. Cela représente ${income ? Math.round(expense / income * 100) : 0} % de vos revenus.`
  if (/epargne|economis|fonds|saving|emergency fund/.test(q)) {
    const goal = state.savings[0]
    return en ? `Your “${localizeSavingsTitle(goal.title, state.settings.language)}” goal is ${Math.round(goal.current / goal.target * 100)}% funded. ${money(goal.target - goal.current)} remains. Tip: ${pick(financeTips)}` : `Votre objectif « ${localizeSavingsTitle(goal.title, state.settings.language)} » est financé à ${Math.round(goal.current / goal.target * 100)} %. Il reste ${money(goal.target - goal.current)}. Conseil : ${pick(financeTips)}`
  }
  if (/planif|journee|tache|faire|plan|day|task|todo/.test(q)) {
    const top = [...active].sort((a, b) => ['urgent', 'high', 'medium', 'low'].indexOf(a.priority) - ['urgent', 'high', 'medium', 'low'].indexOf(b.priority)).slice(0, 3)
    if (!top.length) return en ? 'Your active list is empty. Choose one important priority and add it to your tasks.' : 'Votre liste active est vide. Choisissez une seule priorité importante et ajoutez-la à vos tâches.'
    return en ? `Here is a simple plan:\n1. ${top[0]?.title}\n2. ${top[1]?.title ?? 'Take an active break'}\n3. ${top[2]?.title ?? 'Prepare tomorrow'}\nStart with 25 minutes without notifications.` : `Voici un plan simple :\n1. ${top[0]?.title}\n2. ${top[1]?.title ?? 'Faire une pause active'}\n3. ${top[2]?.title ?? 'Préparer demain'}\nCommencez par 25 minutes sans notifications.`
  }
  if (/objectif|progression|but|goal|progress/.test(q)) return state.goals.map(goal => `• ${localizeSavingsTitle(goal.title, state.settings.language)}: ${Math.round(goal.progress / goal.target * 100)}%`).join('\n')
  if (/conseil.*fin|argent|invest|financial|money/.test(q)) return en ? `Tip of the day: ${pick(financeTips)}` : `Conseil du jour : ${pick(financeTips)}`
  if (/productiv|focus|concentr|temps|time/.test(q)) return en ? `For your productivity: ${pick(productivity)}` : `Pour votre productivité : ${pick(productivity)}`
  if (/motiv|courage|citation|quote/.test(q)) return pick(motivation)
  if (/coach|bilan|resume|overview|summary/.test(q)) {
    const completedHabits = state.habits.filter(habit => habit.done[new Date().toISOString().slice(0, 10)]).length
    return en ? `Your LifeOS snapshot: ${money(income - expense)} monthly balance, ${active.length} active tasks, and ${completedHabits}/${state.habits.length} habits completed today. Suggested priority: ${active[0]?.title ?? 'plan your next action'}.` : `Votre point LifeOS : ${money(income - expense)} de solde mensuel, ${active.length} tâches actives et ${completedHabits}/${state.habits.length} habitudes validées aujourd’hui. Priorité suggérée : ${active[0]?.title ?? 'planifier une prochaine action'}.`
  }
  if (/meteo|weather|pluie|rain/.test(q)) return en ? `The dashboard weather shows a mild day in ${state.settings.weatherCity}. Open the Weather card for current data and forecasts.` : `La météo du dashboard indique une journée douce à ${state.settings.weatherCity}. Consultez la carte Météo pour les données actualisées et les prévisions.`
  if (/merci|thanks|thank you/.test(q)) return en ? 'You are welcome! I am here for your next step.' : 'Avec plaisir ! Je reste à vos côtés pour la prochaine étape.'
  if (/au revoir|bye|goodbye/.test(q)) return en ? 'See you soon! Your progress is saved locally.' : 'À bientôt ! Votre progression est sauvegardée localement.'
  if (/aide|comment|help|how|\?/.test(q)) return en ? 'I can analyze your budget, summarize your finances, organize tasks, track goals, or suggest a tip. Try: “Give me an overview”.' : 'Je peux analyser votre budget, résumer vos finances, organiser vos tâches, suivre vos objectifs ou proposer un conseil. Essayez : « Fais-moi un bilan ».'
  return en ? `I understand. Here is one useful idea: ${pick(productivity)} You can also ask for a financial overview or a plan for the day.` : `Je comprends. Voici une piste utile : ${pick(productivity)} Vous pouvez aussi me demander un bilan financier ou un plan pour la journée.`
}
export function Chatbot() {
  const open = useLifeStore(state => state.chatOpen); const setOpen = useLifeStore(state => state.setChatOpen); const messages = useLifeStore(state => state.chat); const push = useLifeStore(state => state.pushChat); const typing = useLifeStore(state => state.chatTyping); const setTyping = useLifeStore(state => state.setChatTyping); const clear = useLifeStore(state => state.clearChat); const unread = useLifeStore(state => state.unread); const setUnread = useLifeStore(state => state.setUnread); const settings = useLifeStore(state => state.settings)
  const [input, setInput] = useState(''); const bottomRef = useRef<HTMLDivElement>(null); const firstName = useLifeStore(state => state.profile.name.split(' ')[0]); const en = settings.language === 'en'
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, typing, open])
  useEffect(() => { if (!settings.coachEnabled || settings.coachFrequency === 'never') return; const key = 'lifeos:last-coach'; const last = localStorage.getItem(key); const today = new Date().toISOString().slice(0, 10); if (last !== today) { const id = window.setTimeout(() => { push({ role: 'assistant', text: `${firstName}, ${en ? 'your quick overview is ready' : 'votre mini-bilan est prêt'}: ${getReply('coach bilan')}` }); if (!open) setUnread(1); localStorage.setItem(key, today) }, 1800); return () => window.clearTimeout(id) } }, [])
  const send = (text = input) => { const clean = text.trim(); if (!clean || typing) return; push({ role: 'user', text: clean }); setInput(''); setTyping(true); window.setTimeout(() => { push({ role: 'assistant', text: getReply(clean) }); setTyping(false) }, 650 + Math.random() * 550) }
  const title = useMemo(() => open ? (en ? 'Close assistant' : 'Fermer l’assistant') : (en ? 'Open LifeOS assistant' : 'Ouvrir l’assistant LifeOS'), [open, en])
  return <><AnimatePresence>{open && <motion.section className="chat-window" initial={{ opacity: 0, scale: .94, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 20 }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} role="dialog" aria-label="LifeOS Assistant"><header className="chat-header"><img src="assets/avatar-bot.svg" alt="Avatar LifeOS Assistant" /><div><strong>LifeOS Assistant</strong><span><i /> {en ? 'Online · local' : 'En ligne · local'}</span></div><IconButton label={en ? 'Clear history' : 'Effacer l’historique'} onClick={clear}><Trash2 size={16} /></IconButton><IconButton label={en ? 'Close' : 'Fermer'} onClick={() => setOpen(false)}><X size={18} /></IconButton></header><div className="chat-context"><Sparkles size={14} /> {en ? 'I answer using your LifeOS data' : 'Je réponds à partir de vos données LifeOS'}</div><div className="chat-messages">{messages.map(message => <motion.div key={message.id} className={`chat-message ${message.role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{message.role === 'assistant' && <img src="assets/avatar-bot.svg" alt="" />}<div>{(message.id === 'welcome' ? (en ? `Hello ${firstName}! I’m your LifeOS assistant. I can analyze your budget, organize your day, or help you stay on track.` : `Bonjour ${firstName} ! Je suis votre assistant LifeOS. Je peux analyser votre budget, organiser votre journée ou vous aider à garder le cap.`) : message.text).split('\n').map((line, index) => <span key={index}>{line}</span>)}<small>{new Date(message.createdAt).toLocaleTimeString(en ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit', hour12: settings.hour12, timeZone: settings.timezone })}</small></div></motion.div>)}{typing && <div className="chat-message assistant"><img src="assets/avatar-bot.svg" alt="" /><div className="typing"><i /><i /><i /></div></div>}<div ref={bottomRef} /></div><div className="chat-suggestions">{suggestions[settings.language].map(item => <button key={item} onClick={() => send(item)}>{item}</button>)}</div><div className="chat-input"><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }} rows={1} placeholder={en ? 'Ask your question…' : 'Posez votre question…'} aria-label="Message" /><button onClick={() => send()} disabled={!input.trim() || typing} aria-label={en ? 'Send' : 'Envoyer'}><Send size={18} /></button></div></motion.section>}</AnimatePresence><motion.button className={`chat-fab ${open ? 'open' : ''}`} onClick={() => { setOpen(!open); setUnread(0) }} whileHover={{ scale: 1.08 }} whileTap={{ scale: .94 }} aria-label={title} title={title}>{open ? <X size={23} /> : <MessageCircle size={24} />}{!open && unread > 0 && <span>{unread}</span>}<i className="chat-fab-ring" /></motion.button></>
}
