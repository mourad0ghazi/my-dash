import { useEffect, useState } from 'react'
import { AlarmClock, ChevronRight, Cloud, CloudRain, CloudSun, Pause, Play, RotateCcw, Sparkles, Sun, Wind } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import { Badge, Button, IconButton, RingProgress, Select } from '../ui/primitives'
import { Widget } from '../dashboard/Widget'

function useCopy() {
  const language = useLifeStore(state => state.settings.language)
  return { language, l: (french: string, english: string) => language === 'en' ? english : french }
}
function isoWeek(date: Date) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7))
  return Math.ceil((((value.getTime() - Date.UTC(value.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7)
}
function AnalogClock({ date }: { date: Date }) {
  const seconds = date.getSeconds() * 6; const minutes = date.getMinutes() * 6 + seconds / 60; const hours = (date.getHours() % 12) * 30 + minutes / 12
  return <div className="analog-clock"><span className="clock-mark mark-12">12</span><span className="clock-mark mark-3">3</span><span className="clock-mark mark-6">6</span><span className="clock-mark mark-9">9</span><i className="clock-hand hour" style={{ transform: `rotate(${hours}deg)` }} /><i className="clock-hand minute" style={{ transform: `rotate(${minutes}deg)` }} /><i className="clock-hand second" style={{ transform: `rotate(${seconds}deg)` }} /><b /></div>
}
export function ClockWidget() {
  const [date, setDate] = useState(new Date()); const [analog, setAnalog] = useState(false); const settings = useLifeStore(state => state.settings); const { l, language } = useCopy()
  useEffect(() => { const id = window.setInterval(() => setDate(new Date()), 1000); return () => window.clearInterval(id) }, [])
  const locale = language === 'en' ? 'en-US' : 'fr-FR'
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: settings.hour12, timeZone: settings.timezone }).format(date)
  const dateText = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: settings.timezone }).format(date)
  return <Widget id="clock" title={l('Horloge', 'Clock')} icon={AlarmClock} action={<button className="mini-switch" onClick={() => setAnalog(value => !value)}>{analog ? l('Numérique', 'Digital') : l('Analogique', 'Analog')}</button>}>
    <div className="clock-body">{analog ? <AnalogClock date={date} /> : <><div className="digital-time">{time}</div><p>{dateText}</p><small>{l('Semaine', 'Week')} {isoWeek(date)} · {settings.timezone.split('/').pop()}</small></>}</div>
  </Widget>
}

const cities: Record<string, { lat: number; lon: number }> = { Casablanca: { lat: 33.57, lon: -7.59 }, Paris: { lat: 48.86, lon: 2.35 }, London: { lat: 51.51, lon: -0.13 }, Dubai: { lat: 25.2, lon: 55.27 }, Tokyo: { lat: 35.68, lon: 139.69 }, 'New York': { lat: 40.71, lon: -74.01 } }
function weatherMeta(code: number, en: boolean) { if (code <= 1) return { label: en ? 'Sunny' : 'Ensoleillé', Icon: Sun }; if (code <= 3) return { label: en ? 'Cloudy' : 'Nuageux', Icon: CloudSun }; if (code < 60) return { label: en ? 'Light mist' : 'Brume légère', Icon: Cloud }; return { label: en ? 'Showers' : 'Averses', Icon: CloudRain } }
export function WeatherWidget() {
  const settings = useLifeStore(state => state.settings); const update = useLifeStore(state => state.updateSettings); const { l, language } = useCopy()
  const [weather, setWeather] = useState({ temp: 24, apparent: 25, humidity: 61, wind: 14, code: 1, daily: [25, 23, 26] }); const [loading, setLoading] = useState(false)
  useEffect(() => {
    const city = cities[settings.weatherCity] ?? cities.Casablanca; const controller = new AbortController(); setLoading(true)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max&timezone=auto&forecast_days=3`, { signal: controller.signal })
      .then(response => response.json()).then(data => setWeather({ temp: Math.round(data.current.temperature_2m), apparent: Math.round(data.current.apparent_temperature), humidity: data.current.relative_humidity_2m, wind: Math.round(data.current.wind_speed_10m), code: data.current.weather_code, daily: data.daily.temperature_2m_max.map(Math.round) })).catch(() => undefined).finally(() => setLoading(false))
    return () => controller.abort()
  }, [settings.weatherCity])
  const { label, Icon } = weatherMeta(weather.code, language === 'en')
  const locale = language === 'en' ? 'en-US' : 'fr-FR'
  return <Widget id="weather" title={l('Météo', 'Weather')} icon={CloudSun} action={<Select className="select-mini" value={settings.weatherCity} onChange={event => update({ weatherCity: event.target.value })}>{Object.keys(cities).map(city => <option key={city}>{city}</option>)}</Select>}>
    <div className={loading ? 'weather-body is-loading' : 'weather-body'}><div className="weather-icon weather-icon-float"><Icon size={50} strokeWidth={1.4} /></div><div><div className="weather-temp">{weather.temp}°</div><strong>{label}</strong><p>{l('Ressenti', 'Feels like')} {weather.apparent}°</p></div></div>
    <div className="weather-details"><span><Cloud size={14} /> {weather.humidity}%</span><span><Wind size={14} /> {weather.wind} km/h</span></div>
    <div className="forecast">{weather.daily.map((temp, index) => { const date = new Date(); date.setDate(date.getDate() + index); return <div key={index}><small>{index === 0 ? l('Auj.', 'Today') : new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)}</small><strong>{temp}°</strong></div> })}</div>
  </Widget>
}

export function PomodoroWidget() {
  const { l } = useCopy()
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
