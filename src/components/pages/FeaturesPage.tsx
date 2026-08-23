import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Bot, CalendarSync, Check, Cloud, Code2, Download, FileBarChart, KeyRound, Landmark, LifeBuoy, Mail,
  Palette, PlugZap, Printer, RefreshCw, Sparkles, Upload, Users, WifiOff,
} from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { translate } from '../../i18n/translations'
import { currency, downloadFile, toCSV } from '../../utils/formatters'
import { createRestorableLifePatch } from '../../utils/backupValidation'
import { downloadLifeReport, prepareReportEmail, printLifeReport, type LifeReportData } from '../../utils/reportGenerator'
import { fadeInUp, pageTransition, staggerContainer } from '../../utils/animations'
import { Badge, Button, Field, Input, Select, Textarea, Toggle } from '../ui/primitives'

const features = [
  { id: 'ai', title: 'IA avancée', text: 'Analyses contextuelles et recommandations adaptées à vos données.', icon: Bot, group: 'Intelligence' },
  { id: 'reports', title: 'Rapports automatiques', text: 'Bilans complets à télécharger, imprimer ou préparer par e-mail.', icon: FileBarChart, group: 'Données' },
  { id: 'bank', title: 'Synchronisation bancaire', text: 'Connecteur local de démonstration et import de transactions.', icon: Landmark, group: 'Finances' },
  { id: 'cloud', title: 'Sauvegarde & restauration', text: 'Exportez et restaurez un snapshot complet de LifeOS.', icon: Cloud, group: 'Données' },
  { id: 'family', title: 'Espace famille', text: 'Gérez les membres et les responsabilités du foyer.', icon: Users, group: 'Collaboration' },
  { id: 'integrations', title: 'Intégrations', text: 'Ponts exportables vers Google, Outlook, Notion et Trello.', icon: PlugZap, group: 'Connexions' },
  { id: 'offline', title: 'Mode hors-ligne', text: 'LifeOS reste accessible grâce à son cache local.', icon: WifiOff, group: 'Mobilité' },
  { id: 'themes', title: 'Thèmes personnalisés', text: 'Adaptez l’accent, la densité et l’ambiance.', icon: Palette, group: 'Apparence' },
  { id: 'api', title: 'API développeurs', text: 'Générez une clé et un paquet local pour vos automatisations.', icon: Code2, group: 'Développeurs' },
  { id: 'support', title: 'Centre d’aide', text: 'Conservez et exportez une demande d’aide sans limite.', icon: LifeBuoy, group: 'Assistance' },
] as const

type FeatureId = typeof features[number]['id']
const featureIds = new Set<string>(features.map(feature => feature.id))
const readLocal = (key: string) => { try { return localStorage.getItem(key) ?? '' } catch { return '' } }
const writeLocal = (key: string, value: string) => { try { localStorage.setItem(key, value); return true } catch { return false } }
const routeFeature = (): FeatureId | null => {
  const candidate = window.location.hash.replace('#/', '').split('?')[0].split('/')[1]
  return featureIds.has(candidate) ? candidate as FeatureId : null
}
const englishFeatures: Record<FeatureId, { title: string; text: string; group: string }> = {
  ai: { title: 'Advanced AI', text: 'Contextual insights and recommendations adapted to your data.', group: 'Intelligence' },
  reports: { title: 'Automated reports', text: 'Complete reviews to download, print or prepare by email.', group: 'Data' },
  bank: { title: 'Bank sync', text: 'Local demo connector and transaction import.', group: 'Finances' },
  cloud: { title: 'Backup & restore', text: 'Export and restore a complete LifeOS snapshot.', group: 'Data' },
  family: { title: 'Family space', text: 'Manage household members and responsibilities.', group: 'Collaboration' },
  integrations: { title: 'Integrations', text: 'Exportable bridges to Google, Outlook, Notion and Trello.', group: 'Connections' },
  offline: { title: 'Offline mode', text: 'LifeOS stays available through its local cache.', group: 'Mobility' },
  themes: { title: 'Custom themes', text: 'Adjust accent, density and atmosphere.', group: 'Appearance' },
  api: { title: 'Developer API', text: 'Generate a key and local package for automations.', group: 'Developers' },
  support: { title: 'Help center', text: 'Keep and export a help request without limits.', group: 'Support' },
}

function calendarICS(events: ReturnType<typeof useLifeStore.getState>['events']) {
  const escape = (value: string) => value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LifeOS//Calendar//FR', ...events.flatMap(event => {
    const date = event.date.replace(/-/g, '')
    const time = (event.time || '09:00').replace(':', '') + '00'
    return ['BEGIN:VEVENT', `UID:${event.id}@lifeos.local`, `DTSTAMP:${stamp}`, `DTSTART:${date}T${time}`, `SUMMARY:${escape(event.title)}`, 'END:VEVENT']
  }), 'END:VCALENDAR'].join('\r\n')
}

export function FeaturesPage() {
  const [selected, setSelected] = useState<FeatureId | null>(routeFeature)
  const settings = useLifeStore(state => state.settings); const updateSettings = useLifeStore(state => state.updateSettings); const profile = useLifeStore(state => state.profile); const financeProfile = useLifeStore(state => state.financeProfile)
  const transactions = useLifeStore(state => state.transactions); const budgets = useLifeStore(state => state.budgets); const tasks = useLifeStore(state => state.tasks); const savings = useLifeStore(state => state.savings); const events = useLifeStore(state => state.events)
  const setChatOpen = useLifeStore(state => state.setChatOpen); const members = useLifeStore(state => state.members); const addMember = useLifeStore(state => state.addMember); const integrations = useLifeStore(state => state.integrations); const toggleIntegration = useLifeStore(state => state.toggleIntegration)
  const bankConnected = useLifeStore(state => state.bankConnected); const connectBank = useLifeStore(state => state.connectBank); const apiKey = useLifeStore(state => state.apiKey); const generateApiKey = useLifeStore(state => state.generateApiKey); const pushToast = useLifeStore(state => state.pushToast)
  const restoreInput = useRef<HTMLInputElement>(null); const [memberName, setMemberName] = useState(''); const [memberRole, setMemberRole] = useState('member'); const [support, setSupport] = useState(() => readLocal('lifeos:support-draft')); const [lastBackup, setLastBackup] = useState(() => readLocal('lifeos:last-backup'))
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key); const en = settings.language === 'en'; const l = (french: string, english: string) => en ? english : french
  useEffect(() => { const onHash = () => setSelected(routeFeature()); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash) }, [])
  const localized = settings.language === 'en' ? features.map(feature => ({ ...feature, ...englishFeatures[feature.id] })) : features
  const feature = localized.find(item => item.id === selected)
  const current = useMemo(() => { const now = new Date(); return transactions.filter(item => { const date = new Date(item.date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() }) }, [transactions])
  const income = current.filter(item => item.type === 'income').reduce((total, item) => total + item.amount, 0); const expense = current.filter(item => item.type === 'expense').reduce((total, item) => total + item.amount, 0)
  const reportData: LifeReportData = { profile, settings, transactions, budgets, savings, tasks, financeProfile }
  const openFeature = (id: FeatureId) => { window.location.hash = `#/features/${id}`; setSelected(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const closeFeature = () => { window.location.hash = '#/features'; setSelected(null) }
  const roleLabel = (role: string) => ({ member: l('Membre', 'Member'), parent: l('Parent', 'Parent'), child: l('Enfant', 'Child'), observer: l('Observateur', 'Observer'), Administrateur: l('Administrateur', 'Administrator') }[role] ?? role)
  const backup = () => {
    const state = useLifeStore.getState(); const createdAt = new Date().toISOString()
    const data = {
      version: 2, createdAt, profile: state.profile, settings: state.settings, financeProfile: state.financeProfile,
      tasks: state.tasks, notes: state.notes, habits: state.habits, journal: state.journal, goals: state.goals, events: state.events,
      transactions: state.transactions, budgets: state.budgets, savings: state.savings, investments: state.investments,
      layouts: state.layouts, visibleWidgets: state.visibleWidgets, editMode: state.editMode, chat: state.chat, unread: state.unread,
      financeCoach: state.financeCoach, members: state.members, integrations: state.integrations, bankConnected: state.bankConnected,
      apiKey: state.apiKey, lastExcelImport: state.lastExcelImport,
    }
    downloadFile(`lifeos-backup-${createdAt.slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json'); writeLocal('lifeos:last-backup', createdAt); setLastBackup(createdAt); pushToast({ title: l('Sauvegarde créée', 'Backup created'), message: l('Le fichier complet a été téléchargé.', 'The complete file was downloaded.'), tone: 'success' })
  }
  const restore = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      const patch = createRestorableLifePatch(parsed, useLifeStore.getState())
      useLifeStore.setState(patch)
      pushToast({ title: l('Sauvegarde restaurée', 'Backup restored'), message: l('Les données compatibles ont été vérifiées puis appliquées.', 'Compatible data was verified and applied.'), tone: 'success' })
    } catch { pushToast({ title: l('Fichier de sauvegarde invalide', 'Invalid backup file'), message: l('Aucune donnée n’a été modifiée.', 'No data was changed.'), tone: 'danger' }) }
    if (restoreInput.current) restoreInput.current.value = ''
  }
  const enableOffline = async () => {
    if (!('serviceWorker' in navigator)) { pushToast({ title: l('Mode hors-ligne non pris en charge', 'Offline mode is not supported'), tone: 'warning' }); return }
    try {
      await navigator.serviceWorker.register('sw.js')
      pushToast({ title: l('Mode hors-ligne activé', 'Offline mode enabled'), message: l('L’interface et les ressources essentielles sont en cache.', 'The interface and essential resources are cached.'), tone: 'success' })
    } catch { pushToast({ title: l('Activation hors-ligne impossible', 'Unable to enable offline mode'), message: l('Réessayez depuis une connexion sécurisée.', 'Try again from a secure connection.'), tone: 'warning' }) }
  }
  const exportIntegration = (id: string) => {
    if (id === 'google' || id === 'outlook') downloadFile(`lifeos-calendar-${id}.ics`, calendarICS(events), 'text/calendar;charset=utf-8')
    else if (id === 'notion') downloadFile('lifeos-notion-tasks.csv', toCSV(tasks as unknown as Record<string, unknown>[]), 'text/csv;charset=utf-8')
    else downloadFile('lifeos-trello-tasks.json', JSON.stringify(tasks.map(task => ({ name: task.title, status: task.status, due: task.dueDate, labels: task.tags })), null, 2), 'application/json')
    pushToast({ title: l('Fichier de connexion exporté', 'Connection file exported'), tone: 'success' })
  }
  const saveSupport = () => {
    if (!support.trim()) return
    const saved = writeLocal('lifeos:support-draft', support)
    pushToast({ title: saved ? l('Demande enregistrée localement', 'Request saved locally') : l('Enregistrement local impossible', 'Unable to save locally'), tone: saved ? 'success' : 'warning' })
  }
  const copyApiKey = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(apiKey)
      pushToast({ title: l('Clé copiée', 'Key copied'), tone: 'success' })
    } catch { pushToast({ title: l('Copie impossible', 'Unable to copy'), message: l('Sélectionnez la clé affichée et copiez-la manuellement.', 'Select the displayed key and copy it manually.'), tone: 'warning' }) }
  }

  if (!selected || !feature) return <motion.div className="inner-page features-page" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
    <section className="features-hero"><div><Badge tone="success"><Sparkles size={12} /> {t('featuresKicker')}</Badge><h1>{t('featuresTitle')}<br /><em>{t('alwaysFree')}</em></h1><p>{t('featuresSubtitle')}</p><div className="features-proof"><span><Check size={15} /> {t('fullAccess')}</span><span><Check size={15} /> {t('localData')}</span><span><Check size={15} /> {t('noCard')}</span></div></div><div className="features-orbit"><div className="orbit-core"><img src="assets/logo.svg" alt="LifeOS" /></div>{[Bot, Cloud, Users, Palette].map((Icon, index) => <span key={index} style={{ '--i': index } as React.CSSProperties}><Icon size={20} /></span>)}</div></section>
    <div className="section-heading"><div><span className="page-kicker">{t('advancedTools')}</span><h2>{t('everythingNeeded')}</h2><p>{l('Chaque outil possède maintenant sa propre page et une action réellement utilisable.', 'Every tool now has its own page and a genuinely usable action.')}</p></div><Badge tone="success">10 {t('freeTools')}</Badge></div>
    <motion.div className="feature-grid" variants={staggerContainer} initial="hidden" animate="visible">{localized.map(item => <motion.button variants={fadeInUp} key={item.id} className="feature-card" onClick={() => openFeature(item.id)}><span className="feature-card-head"><span className="feature-card-icon"><item.icon size={22} /></span><Badge tone="success">{t('free').toUpperCase()}</Badge></span><small>{item.group}</small><strong>{item.title}</strong><p>{item.text}</p><span className="feature-open">{t('open')} <ArrowRight size={14} /></span></motion.button>)}</motion.div>
    <footer className="free-manifesto"><CalendarSync size={28} /><div><strong>{l('Une seule version : la version complète.', 'One version only: the complete version.')}</strong><p>{l('Tous les outils sont accessibles gratuitement à chaque utilisateur.', 'Every tool is available to every user for free.')}</p></div></footer>
  </motion.div>

  const FeatureIcon = feature.icon
  return <motion.div className="inner-page feature-tool-page" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
    <button className="feature-back" onClick={closeFeature}><ArrowLeft size={16} /> {l('Tous les outils gratuits', 'All free tools')}</button>
    <section className="feature-tool-hero"><span className="workspace-icon"><FeatureIcon size={25} /></span><div><Badge tone="success">{t('includedFree')}</Badge><small>{feature.group}</small><h1>{feature.title}</h1><p>{feature.text}</p></div></section>
    <section className="feature-workspace feature-workspace-page"><div className="workspace-content">
      {selected === 'ai' && <div className="ai-analysis"><div className="analysis-score"><span>{l('Score de santé financière', 'Financial health score')}</span><strong>{income ? Math.max(0, Math.min(100, Math.round((income - expense) / income * 60 + 40))) : 0}<small>/100</small></strong><em>{l('Calculé depuis le mois actuel', 'Calculated from this month')}</em></div><div className="analysis-findings"><article><Check size={16} /><span><strong>{l('Marge du mois', 'Monthly margin')}</strong><small>{income ? Math.round((income - expense) / income * 100) : 0}% {l('des revenus connus restent disponibles.', 'of known income remains available.')}</small></span></article><article><Sparkles size={16} /><span><strong>{l('Analyse contextuelle', 'Contextual analysis')}</strong><small>{l('Le coach financier combine questionnaire, transactions, budgets et objectifs.', 'The finance coach combines questionnaire, transactions, budgets and goals.')}</small></span></article><div className="inline-actions"><Button onClick={() => setChatOpen(true)}><Bot size={16} /> {l('Ouvrir l’assistant général', 'Open general assistant')}</Button><Button variant="secondary" onClick={() => { window.location.hash = '#/finance-settings'; window.setTimeout(() => window.scrollTo({ top: 0 }), 10) }}>{l('Coach financier', 'Finance coach')}</Button></div></div></div>}
      {selected === 'reports' && <div className="feature-form-layout"><div><Field label={l('Fréquence du bilan', 'Report frequency')}><Select value={settings.reportFrequency} onChange={event => updateSettings({ reportFrequency: event.target.value as typeof settings.reportFrequency })}><option value="weekly">{l('Hebdomadaire', 'Weekly')}</option><option value="monthly">{l('Mensuel', 'Monthly')}</option><option value="quarterly">{l('Trimestriel', 'Quarterly')}</option></Select></Field><p className="helper-text">{l('Le moteur de rapport central rassemble finances, productivité et objectifs dans un document cohérent.', 'The central report engine gathers finances, productivity and goals in one consistent document.')}</p></div><div className="action-panel"><FileBarChart size={30} /><strong>{l('Bilan LifeOS complet', 'Complete LifeOS review')}</strong><span>{l('Finances · Productivité · Objectifs', 'Finances · Productivity · Goals')}</span><Button onClick={() => downloadLifeReport(reportData)}><Download size={16} /> {l('Télécharger le rapport', 'Download report')}</Button><Button variant="secondary" onClick={() => { if (!printLifeReport(reportData)) pushToast({ title: l('Autorisez les fenêtres pour imprimer', 'Allow popups to print'), tone: 'warning' }) }}><Printer size={16} /> {l('Imprimer / PDF', 'Print / PDF')}</Button><Button variant="secondary" onClick={() => prepareReportEmail(reportData, settings.notificationEmail || profile.email)}><Mail size={16} /> {l('Préparer par e-mail', 'Prepare by email')}</Button><Button variant="secondary" onClick={() => downloadFile('transactions-lifeos.csv', toCSV(transactions as unknown as Record<string, unknown>[]), 'text/csv')}><Download size={16} /> CSV</Button></div></div>}
      {selected === 'bank' && <div className="connection-panel"><div className={`connection-status ${bankConnected ? 'connected' : ''}`}><Landmark size={26} /><span><strong>{bankConnected ? l('Compte démo connecté', 'Demo account connected') : l('Aucun compte connecté', 'No account connected')}</strong><small>{bankConnected ? l('Dernière synchronisation : à l’instant', 'Last synced: just now') : l('Simulation locale explicite : aucune banque réelle ne reçoit de requête.', 'Explicit local simulation: no real bank receives a request.')}</small></span><Badge tone={bankConnected ? 'success' : 'neutral'}>{bankConnected ? l('ACTIF', 'ACTIVE') : 'LOCAL'}</Badge></div><div className="inline-actions"><Button onClick={connectBank}>{bankConnected ? l('Déconnecter', 'Disconnect') : l('Connecter le compte démo', 'Connect demo account')}</Button><Button variant="secondary" onClick={() => { window.location.hash = '#/settings'; window.setTimeout(() => document.querySelector('.excel-import-hub')?.scrollIntoView({ behavior: 'smooth' }), 500) }}><Upload size={15} /> {l('Importer un relevé Excel', 'Import an Excel statement')}</Button></div></div>}
      {selected === 'cloud' && <div className="backup-panel"><Cloud size={36} /><h3>{l('Une sauvegarde portable, sous votre contrôle', 'A portable backup under your control')}</h3><p>{l('Le fichier JSON contient vos données LifeOS. Conservez-le dans l’emplacement de votre choix puis restaurez-le ici.', 'The JSON file contains your LifeOS data. Keep it wherever you choose, then restore it here.')}</p><div className="inline-actions"><Button onClick={backup}><Download size={16} /> {l('Télécharger une sauvegarde', 'Download backup')}</Button><Button variant="secondary" onClick={() => restoreInput.current?.click()}><Upload size={16} /> {l('Restaurer un fichier', 'Restore file')}</Button></div><input ref={restoreInput} hidden type="file" accept="application/json,.json" onChange={event => restore(event.target.files?.[0])} /><small>{l('Dernière sauvegarde :', 'Last backup:')} {lastBackup ? new Date(lastBackup).toLocaleString(en ? 'en-US' : 'fr-FR') : l('Jamais', 'Never')}</small></div>}
      {selected === 'family' && <div className="family-layout"><div className="member-list">{members.map(member => <article key={member.id}><span>{member.initials}</span><div><strong>{member.name}</strong><small>{roleLabel(member.role)}</small></div><Badge tone="success">{l('Actif', 'Active')}</Badge></article>)}</div><div className="member-form"><Field label={l('Nom', 'Name')}><Input value={memberName} onChange={event => setMemberName(event.target.value)} placeholder={l('Nom du membre', 'Member name')} /></Field><Field label={l('Rôle', 'Role')}><Select value={memberRole} onChange={event => setMemberRole(event.target.value)}><option value="member">{l('Membre', 'Member')}</option><option value="parent">{l('Parent', 'Parent')}</option><option value="child">{l('Enfant', 'Child')}</option><option value="observer">{l('Observateur', 'Observer')}</option></Select></Field><Button onClick={() => { if (memberName.trim()) { addMember(memberName.trim(), memberRole); setMemberName('') } }}><Users size={16} /> {l('Ajouter au foyer', 'Add to household')}</Button></div></div>}
      {selected === 'integrations' && <div className="integration-grid">{integrations.map(item => <article key={item.id}><span className="integration-logo">{item.name.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{item.enabled ? l('Pont local activé', 'Local bridge enabled') : l('Prêt à exporter', 'Ready to export')}</small><button onClick={() => exportIntegration(item.id)}>{item.id === 'google' || item.id === 'outlook' ? 'ICS' : l('Exporter', 'Export')}</button></div><Toggle label={`${l('Activer', 'Enable')} ${item.name}`} checked={item.enabled} onChange={() => toggleIntegration(item.id)} /></article>)}</div>}
      {selected === 'offline' && <div className="offline-panel"><WifiOff size={40} /><div><h3>{l('LifeOS partout, même sans réseau', 'LifeOS everywhere, even offline')}</h3><p>{l('Le service worker met en cache l’interface et les ressources essentielles. Vos données restent dans le stockage local.', 'The service worker caches the interface and essential resources. Your data remains in local storage.')}</p><Button onClick={enableOffline}><RefreshCw size={16} /> {l('Activer et actualiser le cache', 'Enable and refresh cache')}</Button></div></div>}
      {selected === 'themes' && <div className="theme-panel"><div><h3>{l('Couleur d’accent', 'Accent color')}</h3><div className="accent-picker">{(['smoke', 'sage', 'slate', 'terracotta', 'graphite'] as const).map(accent => <button key={accent} className={`accent-${accent} ${settings.accent === accent ? 'active' : ''}`} onClick={() => updateSettings({ accent })} aria-label={accent}><Check size={14} /></button>)}</div></div><div><h3>{l('Ambiance', 'Appearance')}</h3><div className="choice-row"><button className={settings.theme === 'light' ? 'active' : ''} onClick={() => updateSettings({ theme: 'light' })}>{l('Clair', 'Light')}</button><button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => updateSettings({ theme: 'dark' })}>{l('Sombre', 'Dark')}</button><button className={settings.theme === 'auto' ? 'active' : ''} onClick={() => updateSettings({ theme: 'auto' })}>{l('Auto', 'Auto')}</button></div><h3>{l('Densité', 'Density')}</h3><div className="choice-row">{(['compact', 'comfortable', 'spacious'] as const).map(value => <button key={value} className={settings.density === value ? 'active' : ''} onClick={() => updateSettings({ density: value })}>{value}</button>)}</div></div></div>}
      {selected === 'api' && <div className="api-panel"><div className="code-window"><span>{l('Clé API locale', 'Local API key')}</span><code>{apiKey || l('Aucune clé générée', 'No key generated')}</code></div><div><p>{l('La clé identifie vos propres automatisations locales. Le paquet JSON fournit une base de données portable, sans ouvrir de serveur.', 'The key identifies your own local automations. The JSON package provides portable data without opening a server.')}</p><div className="inline-actions"><Button onClick={generateApiKey}><KeyRound size={16} /> {apiKey ? l('Régénérer', 'Regenerate') : l('Générer une clé', 'Generate key')}</Button>{apiKey && <Button variant="secondary" onClick={copyApiKey}>{l('Copier', 'Copy')}</Button>}<Button variant="secondary" onClick={() => downloadFile('lifeos-local-api.json', JSON.stringify({ generatedAt: new Date().toISOString(), transactions, tasks, savings }, null, 2), 'application/json')}><Download size={15} /> {l('Paquet JSON', 'JSON package')}</Button></div></div></div>}
      {selected === 'support' && <div className="support-panel"><div><LifeBuoy size={36} /><h3>{l('Un carnet d’aide qui ne perd rien', 'A help notebook that loses nothing')}</h3><p>{l('Sans serveur de support, LifeOS conserve honnêtement votre brouillon sur cet appareil et permet de l’exporter.', 'Without a support server, LifeOS honestly keeps your draft on this device and lets you export it.')}</p></div><div><Field label={l('Votre demande', 'Your request')}><Textarea rows={7} value={support} onChange={event => setSupport(event.target.value)} placeholder={l('Décrivez le problème, le contexte et le résultat attendu…', 'Describe the issue, context and expected result…')} /></Field><div className="inline-actions"><Button onClick={saveSupport}>{l('Enregistrer', 'Save')}</Button><Button variant="secondary" disabled={!support.trim()} onClick={() => downloadFile('lifeos-support-request.txt', support, 'text/plain;charset=utf-8')}><Download size={15} /> {l('Exporter', 'Export')}</Button></div></div></div>}
    </div></section>
    <footer className="free-manifesto"><CalendarSync size={28} /><div><strong>{l('Cet outil est complet et gratuit.', 'This tool is complete and free.')}</strong><p>{l('Aucun paiement, essai limité ou verrouillage ne se cache derrière cette page.', 'No payment, limited trial or lock is hidden behind this page.')}</p></div></footer>
  </motion.div>
}
