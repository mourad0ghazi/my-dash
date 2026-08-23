import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlarmClock, CalendarDays, Check, CheckSquare, ChevronLeft, ChevronRight, Circle, Cloud, CloudRain, CloudSun, Edit3,
  Flame, Goal as GoalIcon, ListFilter, NotebookPen, Pause, Play, Plus, RotateCcw, Sparkles, StickyNote, Sun, Trash2, Wind, X,
} from 'lucide-react'
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useLifeStore } from '../../store/useLifeStore'
import { dateLabel, relativeDate, timeLabel, todayISO } from '../../utils/formatters'
import type { Priority, TaskStatus } from '../../types'
import { Badge, Button, Field, IconButton, Input, Modal, Progress, RingProgress, Select, Textarea } from '../ui/primitives'
import { Widget } from '../dashboard/Widget'

function useModuleCopy() {
  const language = useLifeStore(state => state.settings.language)
  return { language, locale: language === 'en' ? enUS : fr, l: (french: string, english: string) => language === 'en' ? english : french }
}

function AnalogClock({ date }: { date: Date }) {
  const seconds = date.getSeconds() * 6; const minutes = date.getMinutes() * 6 + seconds / 60; const hours = (date.getHours() % 12) * 30 + minutes / 12
  return <div className="analog-clock"><span className="clock-mark mark-12">12</span><span className="clock-mark mark-3">3</span><span className="clock-mark mark-6">6</span><span className="clock-mark mark-9">9</span><i className="clock-hand hour" style={{ transform: `rotate(${hours}deg)` }} /><i className="clock-hand minute" style={{ transform: `rotate(${minutes}deg)` }} /><i className="clock-hand second" style={{ transform: `rotate(${seconds}deg)` }} /><b /></div>
}
export function ClockWidget() {
  const [date, setDate] = useState(new Date()); const [analog, setAnalog] = useState(false); const settings = useLifeStore(state => state.settings); const { l } = useModuleCopy()
  useEffect(() => { const id = window.setInterval(() => setDate(new Date()), 1000); return () => window.clearInterval(id) }, [])
  const time = new Intl.DateTimeFormat(settings.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: settings.hour12, timeZone: settings.timezone }).format(date)
  return <Widget id="clock" title={l('Horloge', 'Clock')} icon={AlarmClock} action={<button className="mini-switch" onClick={() => setAnalog(value => !value)}>{analog ? l('Numérique', 'Digital') : l('Analogique', 'Analog')}</button>}>
    <div className="clock-body">{analog ? <AnalogClock date={date} /> : <><div className="digital-time">{time}</div><p>{dateLabel(format(date, 'yyyy-MM-dd'), 'EEEE d MMMM', settings.language, settings.dateFormat)}</p><small>{l('Semaine', 'Week')} {format(date, 'II')} · {settings.timezone.split('/').pop()}</small></>}</div>
  </Widget>
}

const cities: Record<string, { lat: number; lon: number }> = { Casablanca: { lat: 33.57, lon: -7.59 }, Paris: { lat: 48.86, lon: 2.35 }, London: { lat: 51.51, lon: -0.13 }, Dubai: { lat: 25.2, lon: 55.27 }, Tokyo: { lat: 35.68, lon: 139.69 }, 'New York': { lat: 40.71, lon: -74.01 } }
function weatherMeta(code: number, en: boolean) { if (code <= 1) return { label: en ? 'Sunny' : 'Ensoleillé', Icon: Sun }; if (code <= 3) return { label: en ? 'Cloudy' : 'Nuageux', Icon: CloudSun }; if (code < 60) return { label: en ? 'Light mist' : 'Brume légère', Icon: Cloud }; return { label: en ? 'Showers' : 'Averses', Icon: CloudRain } }
export function WeatherWidget() {
  const settings = useLifeStore(state => state.settings); const update = useLifeStore(state => state.updateSettings); const { l, locale, language } = useModuleCopy()
  const [weather, setWeather] = useState({ temp: 24, apparent: 25, humidity: 61, wind: 14, code: 1, daily: [25, 23, 26] }); const [loading, setLoading] = useState(false)
  useEffect(() => {
    const city = cities[settings.weatherCity] ?? cities.Casablanca; const controller = new AbortController(); setLoading(true)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max&timezone=auto&forecast_days=3`, { signal: controller.signal })
      .then(response => response.json()).then(data => setWeather({ temp: Math.round(data.current.temperature_2m), apparent: Math.round(data.current.apparent_temperature), humidity: data.current.relative_humidity_2m, wind: Math.round(data.current.wind_speed_10m), code: data.current.weather_code, daily: data.daily.temperature_2m_max.map(Math.round) })).catch(() => undefined).finally(() => setLoading(false))
    return () => controller.abort()
  }, [settings.weatherCity])
  const { label, Icon } = weatherMeta(weather.code, language === 'en')
  return <Widget id="weather" title={l('Météo', 'Weather')} icon={CloudSun} action={<Select className="select-mini" value={settings.weatherCity} onChange={event => update({ weatherCity: event.target.value })}>{Object.keys(cities).map(city => <option key={city}>{city}</option>)}</Select>}>
    <div className={loading ? 'weather-body is-loading' : 'weather-body'}><motion.div className="weather-icon" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}><Icon size={50} strokeWidth={1.4} /></motion.div><div><div className="weather-temp">{weather.temp}°</div><strong>{label}</strong><p>{l('Ressenti', 'Feels like')} {weather.apparent}°</p></div></div>
    <div className="weather-details"><span><Cloud size={14} /> {weather.humidity}%</span><span><Wind size={14} /> {weather.wind} km/h</span></div>
    <div className="forecast">{weather.daily.map((temp, index) => <div key={index}><small>{index === 0 ? l('Auj.', 'Today') : format(addDays(new Date(), index), 'EEE', { locale })}</small><strong>{temp}°</strong></div>)}</div>
  </Widget>
}

export function PomodoroWidget() {
  const { l } = useModuleCopy()
  const modes = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }; const [mode, setMode] = useState<keyof typeof modes>('focus'); const [seconds, setSeconds] = useState(modes.focus); const [running, setRunning] = useState(false); const [sessions, setSessions] = useState(2)
  const beep = () => { try { const ctx = new AudioContext(); const osc = ctx.createOscillator(); osc.connect(ctx.destination); osc.frequency.value = 740; osc.start(); osc.stop(ctx.currentTime + .18) } catch { /* Browser may block audio. */ } }
  useEffect(() => { if (!running) return; const id = window.setInterval(() => setSeconds(value => { if (value <= 1) { setRunning(false); if (mode === 'focus') setSessions(count => count + 1); beep(); return modes[mode] } return value - 1 }), 1000); return () => window.clearInterval(id) }, [running, mode])
  const changeMode = (next: keyof typeof modes) => { setMode(next); setSeconds(modes[next]); setRunning(false) }
  const pct = ((modes[mode] - seconds) / modes[mode]) * 100
  return <Widget id="pomodoro" title="Focus" icon={Sparkles} action={<Badge tone="neutral">{sessions} {l('sessions', 'sessions')}</Badge>}>
    <div className="pomo-tabs"><button className={mode === 'focus' ? 'active' : ''} onClick={() => changeMode('focus')}>Focus</button><button className={mode === 'short' ? 'active' : ''} onClick={() => changeMode('short')}>{l('Pause', 'Break')}</button><button className={mode === 'long' ? 'active' : ''} onClick={() => changeMode('long')}>{l('Longue', 'Long')}</button></div>
    <div className="pomo-main"><RingProgress value={pct} size={122} stroke={7}><strong className="pomo-time">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong></RingProgress></div>
    <div className="pomo-controls"><IconButton label={l('Réinitialiser', 'Reset')} onClick={() => { setSeconds(modes[mode]); setRunning(false) }}><RotateCcw size={17} /></IconButton><Button size="icon" onClick={() => setRunning(value => !value)}>{running ? <Pause size={20} /> : <Play size={20} />}</Button><IconButton label={l('Passer', 'Skip')} onClick={() => changeMode(mode === 'focus' ? 'short' : 'focus')}><ChevronRight size={18} /></IconButton></div>
  </Widget>
}

const priorityTone: Record<Priority, 'neutral' | 'warning' | 'danger' | 'info'> = { low: 'neutral', medium: 'warning', high: 'danger', urgent: 'danger' }
const nextStatus: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }
export function TasksWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, language } = useModuleCopy()
  const tasks = useLifeStore(state => state.tasks); const dateFormat = useLifeStore(state => state.settings.dateFormat); const setStatus = useLifeStore(state => state.setTaskStatus); const add = useLifeStore(state => state.addTask); const remove = useLifeStore(state => state.deleteTask); const update = useLifeStore(state => state.updateTask)
  const [filter, setFilter] = useState<'active' | 'all' | 'done'>('active'); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<string | null>(null); const [title, setTitle] = useState(''); const [priority, setPriority] = useState<Priority>('medium')
  const list = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.status === 'done' : task.status !== 'done'))
  const submit = () => { if (!title.trim()) return; add({ title: title.trim(), priority, status: 'todo', dueDate: todayISO(1), category: language === 'en' ? 'Personal' : 'Personnel', tags: [], subtasks: [] }); setTitle(''); setOpen(false) }
  const content = <><div className="module-toolbar"><div className="segmented"><button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>{l('Actives', 'Active')}</button><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{l('Toutes', 'All')}</button><button className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>{l('Finies', 'Done')}</button></div><Button size="sm" onClick={() => setOpen(true)}><Plus size={15} /> {l('Ajouter', 'Add')}</Button></div>
    <div className={`task-list ${expanded ? 'expanded-list' : ''}`}>{list.slice(0, expanded ? 50 : 5).map(task => <div className={`task-row status-${task.status}`} key={task.id} draggable={expanded}>
      <button className="task-check" aria-label={`${l('Changer le statut de', 'Change status of')} ${task.title}`} onClick={() => setStatus(task.id, nextStatus[task.status])}>{task.status === 'done' ? <Check size={15} /> : task.status === 'doing' ? <Circle size={14} fill="currentColor" /> : <Circle size={15} />}</button>
      <div className="task-copy">{editing === task.id ? <Input autoFocus value={task.title} onChange={event => update(task.id, { title: event.target.value })} onBlur={() => setEditing(null)} onKeyDown={event => event.key === 'Enter' && setEditing(null)} /> : <button className="task-title" onDoubleClick={() => setEditing(task.id)} onClick={() => setStatus(task.id, nextStatus[task.status])}>{task.title}</button>}<div><Badge tone={priorityTone[task.priority]}>{task.priority}</Badge><small>{dateLabel(task.dueDate, 'd MMM', language, dateFormat)}</small>{task.subtasks.length > 0 && <small>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</small>}</div></div>
      <IconButton label={l('Modifier', 'Edit')} onClick={() => setEditing(task.id)}><Edit3 size={14} /></IconButton><IconButton label={l('Supprimer', 'Delete')} onClick={() => remove(task.id)}><Trash2 size={14} /></IconButton>
    </div>)}</div>
    {!expanded && tasks.filter(task => task.status !== 'done').length > 5 && <p className="module-footnote">+{tasks.filter(task => task.status !== 'done').length - 5} {l('autres tâches', 'more tasks')}</p>}
    <Modal open={open} onClose={() => setOpen(false)} title={l('Nouvelle tâche', 'New task')} description={l('Ajoutez une prochaine action claire.', 'Add a clear next action.')}><div className="form-stack"><Field label={l('Titre', 'Title')}><Input autoFocus value={title} onChange={event => setTitle(event.target.value)} onKeyDown={event => event.key === 'Enter' && submit()} placeholder={l('Ex. Préparer le rendez-vous', 'E.g. Prepare the meeting')} /></Field><Field label={l('Priorité', 'Priority')}><Select value={priority} onChange={event => setPriority(event.target.value as Priority)}><option value="low">{l('Basse', 'Low')}</option><option value="medium">{l('Moyenne', 'Medium')}</option><option value="high">{l('Haute', 'High')}</option><option value="urgent">{l('Urgente', 'Urgent')}</option></Select></Field><div className="modal-actions"><Button variant="ghost" onClick={() => setOpen(false)}>{l('Annuler', 'Cancel')}</Button><Button onClick={submit}>{l('Créer la tâche', 'Create task')}</Button></div></div></Modal></>
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="tasks" title={l('Tâches', 'Tasks')} icon={CheckSquare} eyebrow={`${tasks.filter(task => task.status === 'done').length}/${tasks.length} ${l('terminées', 'completed')}`}>{content}</Widget>
}

export function NotesWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, language } = useModuleCopy()
  const notes = useLifeStore(state => state.notes); const add = useLifeStore(state => state.addNote); const update = useLifeStore(state => state.updateNote); const remove = useLifeStore(state => state.deleteNote)
  const content = <><div className="notes-grid">{notes.slice(0, expanded ? 20 : 3).map(note => <article className="note-card" key={note.id}><div className="note-top"><Input value={note.title} onChange={event => update(note.id, { title: event.target.value })} aria-label={l('Titre de la note', 'Note title')} /><IconButton label={l('Supprimer la note', 'Delete note')} onClick={() => remove(note.id)}><X size={14} /></IconButton></div><Textarea value={note.content} onChange={event => update(note.id, { content: event.target.value })} aria-label={`${l('Contenu de', 'Content of')} ${note.title}`} placeholder={l('Écrivez librement…', 'Write freely…')} /><small>{relativeDate(note.updatedAt, language)}</small></article>)}</div>{expanded && <Button variant="secondary" onClick={add}><Plus size={15} /> {l('Nouvelle note', 'New note')}</Button>}</>
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="notes" title={l('Notes rapides', 'Quick notes')} icon={StickyNote} action={<IconButton label={l('Ajouter une note', 'Add note')} onClick={add}><Plus size={16} /></IconButton>}>{content}</Widget>
}

function weekDates() { const start = startOfWeek(new Date(), { weekStartsOn: 1 }); return Array.from({ length: 7 }, (_, i) => addDays(start, i)) }
export function HabitsWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, locale, language } = useModuleCopy()
  const habits = useLifeStore(state => state.habits); const dateFormat = useLifeStore(state => state.settings.dateFormat); const toggle = useLifeStore(state => state.toggleHabit); const days = useMemo(weekDates, [])
  const content = <div className={`habit-table ${expanded ? 'expanded' : ''}`}><div className="habit-head"><span>{l('Habitude', 'Habit')}</span>{days.map(day => <small key={day.toISOString()}>{format(day, 'EEEEE', { locale })}</small>)}<small>{l('Série', 'Streak')}</small></div>{habits.map(habit => <div className="habit-row" key={habit.id}><strong><span>{habit.icon}</span>{habit.name}</strong>{days.map(day => { const key = format(day, 'yyyy-MM-dd'); const done = habit.done[key]; const missed = habit.missed[key]; return <button key={key} aria-label={`${habit.name} ${dateLabel(key, 'd MMM', language, dateFormat)}`} className={done ? 'habit-done' : missed ? 'habit-missed' : ''} onClick={() => toggle(habit.id, key)}>{done ? <Check size={14} /> : missed ? <X size={14} /> : <Circle size={14} />}</button> })}<span className="streak"><Flame size={14} /> {Object.keys(habit.done).filter(key => habit.done[key]).length}</span></div>)}</div>
  if (expanded) return <div className="standalone-module">{content}<div className="habit-insight"><Sparkles size={18} /><span><strong>{l('82 % de régularité cette semaine', '82% consistency this week')}</strong><small>{l('La méditation est votre habitude la plus stable.', 'Meditation is your most consistent habit.')}</small></span></div></div>
  return <Widget id="habits" title={l('Habitudes', 'Habits')} icon={Sparkles} eyebrow={l('Cette semaine', 'This week')}>{content}</Widget>
}

export function JournalWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, locale, language } = useModuleCopy()
  const entries = useLifeStore(state => state.journal); const save = useLifeStore(state => state.saveJournal); const settings = useLifeStore(state => state.settings)
  const today = todayISO(); const current = entries.find(entry => entry.date === today); const [mood, setMood] = useState(current?.mood ?? '😊'); const [content, setContent] = useState(current?.content ?? ''); const [unlocked, setUnlocked] = useState(!settings.journalLocked); const [pin, setPin] = useState('')
  useEffect(() => { const id = window.setTimeout(() => { if (content || current) save(today, mood, content) }, 400); return () => window.clearTimeout(id) }, [content, mood])
  if (!unlocked) return <Widget id="journal" title="Journal" icon={NotebookPen}><div className="journal-lock"><span>{l('Journal protégé', 'Protected journal')}</span><Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={event => setPin(event.target.value)} placeholder={l('PIN à 4 chiffres', '4-digit PIN')} /><Button size="sm" onClick={() => pin === settings.pin && setUnlocked(true)}>{l('Déverrouiller', 'Unlock')}</Button></div></Widget>
  const contentNode = <><div className="mood-picker">{['😄', '😊', '😐', '😟', '😢'].map(item => <button className={mood === item ? 'active' : ''} key={item} onClick={() => setMood(item)}>{item}</button>)}</div><Textarea className="journal-editor" value={content} onChange={event => setContent(event.target.value)} placeholder={l('Comment s’est passée votre journée ?', 'How was your day?')} /><div className="autosave"><Check size={12} /> {l('Sauvegarde automatique', 'Autosaved')}</div>{expanded && <div className="journal-history">{entries.filter(entry => entry.date !== today).map(entry => <article key={entry.id}><span>{entry.mood}</span><div><strong>{dateLabel(entry.date, 'EEEE d MMMM', language, settings.dateFormat)}</strong><p>{entry.content}</p></div></article>)}</div>}</>
  if (expanded) return <div className="standalone-module">{contentNode}</div>
  return <Widget id="journal" title="Journal" icon={NotebookPen} eyebrow={format(new Date(), 'd MMMM', { locale })}>{contentNode}</Widget>
}

export function GoalsWidget({ expanded = false }: { expanded?: boolean }) {
  const { l } = useModuleCopy()
  const goals = useLifeStore(state => state.goals); const update = useLifeStore(state => state.updateGoal)
  const content = <div className="goal-list">{goals.map(goal => { const pct = goal.target ? goal.progress / goal.target * 100 : 0; return <article className="goal-row" key={goal.id}><div className="goal-heading"><span><Badge>{goal.category}</Badge><strong>{goal.title}</strong></span><button onClick={() => update(goal.id, { progress: Math.min(goal.target, goal.progress + 1) })}>+1</button></div><Progress value={pct} /><div className="goal-meta"><span>{goal.progress} / {goal.target} {goal.unit}</span><span>{Math.round(pct)}%</span></div>{expanded && <div className="milestones">{goal.milestones.map(milestone => <label key={milestone.id}><input type="checkbox" checked={milestone.done} readOnly /> {milestone.title}</label>)}</div>}</article> })}</div>
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="goals" title={l('Objectifs SMART', 'SMART goals')} icon={GoalIcon} eyebrow={l('En progression', 'In progress')}>{content}</Widget>
}

export function CalendarWidget({ expanded = false }: { expanded?: boolean }) {
  const { l, locale, language } = useModuleCopy()
  const events = useLifeStore(state => state.events); const settings = useLifeStore(state => state.settings); const addEvent = useLifeStore(state => state.addEvent); const removeEvent = useLifeStore(state => state.deleteEvent); const [month, setMonth] = useState(new Date()); const [selected, setSelected] = useState(new Date()); const [open, setOpen] = useState(false); const [title, setTitle] = useState(''); const [time, setTime] = useState('09:00')
  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: settings.firstDay }), end: endOfWeek(endOfMonth(month), { weekStartsOn: settings.firstDay }) }), [month, settings.firstDay])
  const weekLabels = settings.firstDay === 0 ? (language === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['D', 'L', 'M', 'M', 'J', 'V', 'S']) : (language === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D'])
  const selectedEvents = events.filter(event => isSameDay(parseISO(event.date), selected))
  const submit = () => { if (!title.trim()) return; addEvent({ title: title.trim(), date: format(selected, 'yyyy-MM-dd'), time, color: '#66736a' }); setTitle(''); setOpen(false) }
  const content = <><div className="calendar-toolbar"><IconButton label={l('Mois précédent', 'Previous month')} onClick={() => setMonth(value => subMonths(value, 1))}><ChevronLeft size={17} /></IconButton><strong>{format(month, 'MMMM yyyy', { locale })}</strong><IconButton label={l('Mois suivant', 'Next month')} onClick={() => setMonth(value => addMonths(value, 1))}><ChevronRight size={17} /></IconButton></div><div className={`calendar-grid ${expanded ? 'calendar-expanded' : ''}`}>{weekLabels.map((day, index) => <small key={index}>{day}</small>)}{days.map(day => { const date = format(day, 'yyyy-MM-dd'); const dayEvents = events.filter(event => event.date === date); return <button key={date} className={`${!isSameMonth(day, month) ? 'outside' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${isSameDay(day, selected) ? 'selected' : ''}`} onClick={() => setSelected(day)}><span>{format(day, 'd')}</span>{dayEvents.length > 0 && <i style={{ background: dayEvents[0].color }} />}</button> })}</div><div className="calendar-events"><div><strong>{isSameDay(selected, new Date()) ? l('Aujourd’hui', 'Today') : dateLabel(format(selected, 'yyyy-MM-dd'), 'd MMMM', language, settings.dateFormat)}</strong><IconButton label={l('Ajouter un événement', 'Add event')} onClick={() => setOpen(true)}><Plus size={15} /></IconButton></div>{selectedEvents.length ? selectedEvents.map(event => <article key={event.id}><i style={{ background: event.color }} /><span><strong>{event.title}</strong><small>{timeLabel(event.time, language, settings.hour12)}</small></span>{expanded && <IconButton label={l('Supprimer', 'Delete')} onClick={() => removeEvent(event.id)}><Trash2 size={14} /></IconButton>}</article>) : <small>{l('Aucun événement', 'No events')}</small>}</div><Modal open={open} onClose={() => setOpen(false)} title={l('Nouvel événement', 'New event')}><div className="form-stack"><Field label={l('Titre', 'Title')}><Input autoFocus value={title} onChange={event => setTitle(event.target.value)} /></Field><Field label={l('Date', 'Date')}><Input type="date" value={format(selected, 'yyyy-MM-dd')} onChange={event => setSelected(parseISO(event.target.value))} /></Field><Field label={l('Heure', 'Time')}><Input type="time" value={time} onChange={event => setTime(event.target.value)} /></Field><div className="modal-actions"><Button variant="ghost" onClick={() => setOpen(false)}>{l('Annuler', 'Cancel')}</Button><Button onClick={submit}>{l('Ajouter', 'Add')}</Button></div></div></Modal></>
  if (expanded) return <div className="standalone-module">{content}</div>
  return <Widget id="calendar" title={l('Calendrier', 'Calendar')} icon={CalendarDays}>{content}</Widget>
}
