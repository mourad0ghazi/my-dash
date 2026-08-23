import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, FileCheck2, FileSpreadsheet, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import type { ExcelDataType, ExcelImportMode, ExcelImportPayload, ExcelImportProgress } from '../../types'
import { Badge, Button, Modal, Toggle } from '../ui/primitives'

const entityLabels: Record<Exclude<ExcelDataType, 'profile' | 'settings'>, [string, string]> = {
  transactions: ['Transactions', 'Transactions'], budgets: ['Budgets', 'Budgets'], tasks: ['Tâches', 'Tasks'], goals: ['Objectifs', 'Goals'],
  savings: ['Épargne', 'Savings'], investments: ['Investissements', 'Investments'], events: ['Événements', 'Events'], notes: ['Notes', 'Notes'], habits: ['Habitudes', 'Habits'],
}
const sheetLabels: Record<ExcelDataType, [string, string]> = { ...entityLabels, profile: ['Profil', 'Profile'], settings: ['Préférences', 'Preferences'] }

export function ExcelImporter({ compact = false }: { compact?: boolean }) {
  const language = useLifeStore(state => state.settings.language); const en = language === 'en'; const l = (fr: string, english: string) => en ? english : fr
  const applyImport = useLifeStore(state => state.applyExcelImport); const pushToast = useLifeStore(state => state.pushToast)
  const inputRef = useRef<HTMLInputElement>(null); const workerRef = useRef<Worker | null>(null)
  const [result, setResult] = useState<ExcelImportPayload>(); const [parsing, setParsing] = useState(false); const [progress, setProgress] = useState<ExcelImportProgress | null>(null)
  const [mode, setMode] = useState<ExcelImportMode>('merge'); const [customize, setCustomize] = useState(true)

  useEffect(() => () => workerRef.current?.terminate(), [])
  const chooseFile = () => inputRef.current?.click()
  const stopReading = () => { workerRef.current?.terminate(); workerRef.current = null; setParsing(false); setProgress(null) }
  const readFile = (file?: File) => {
    if (!file) return
    stopReading(); setResult(undefined); setParsing(true); setProgress({ stage: 'reading', percent: 1 })
    const worker = new Worker(new URL('../../workers/excelImport.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<
      | { type: 'progress'; progress: ExcelImportProgress }
      | { type: 'complete'; payload: ExcelImportPayload }
      | { type: 'error'; error: string }
    >) => {
      if (event.data.type === 'progress') { setProgress(event.data.progress); return }
      if (event.data.type === 'complete') {
        setResult(event.data.payload); setMode('merge'); setCustomize(true); setProgress({ stage: 'finalizing', percent: 100 })
      } else {
        const reason = event.data.error
        const message = reason === 'format'
          ? l('Utilisez un classeur Excel au format .xlsx, .xlsm ou .xls.', 'Use an Excel workbook in .xlsx, .xlsm, or .xls format.')
          : reason === 'empty'
            ? l('Toutes les feuilles ont été lues, mais aucune colonne exploitable n’a été reconnue.', 'Every sheet was read, but no usable columns were recognized.')
            : l('Le classeur est illisible, protégé ou trop volumineux pour la mémoire disponible.', 'The workbook is unreadable, protected, or larger than the available memory.')
        pushToast({ title: l('Import Excel impossible', 'Excel import failed'), message, tone: 'danger' })
      }
      setParsing(false); worker.terminate(); if (workerRef.current === worker) workerRef.current = null
    }
    worker.onerror = () => {
      pushToast({ title: l('Import Excel impossible', 'Excel import failed'), message: l('Le classeur n’a pas pu être analysé localement.', 'The workbook could not be analyzed locally.'), tone: 'danger' })
      setParsing(false); setProgress(null); worker.terminate(); if (workerRef.current === worker) workerRef.current = null
    }
    worker.postMessage({ file, language })
    if (inputRef.current) inputRef.current.value = ''
  }
  const apply = () => {
    if (!result) return
    applyImport(result, mode, customize); setResult(undefined); setProgress(null)
  }
  const counts = result ? Object.entries(result.counts).filter(([, count]) => count > 0) as [keyof typeof result.counts, number][] : []
  const stageLabel = progress ? ({
    reading: l('Lecture du fichier', 'Reading file'), decoding: l('Décodage du classeur', 'Decoding workbook'), indexing: l('Indexation de toutes les feuilles', 'Indexing every sheet'), analyzing: l('Analyse approfondie des lignes', 'Deep row analysis'), finalizing: l('Préparation du bilan', 'Preparing report'),
  } satisfies Record<ExcelImportProgress['stage'], string>)[progress.stage] : ''
  const close = () => { stopReading(); setResult(undefined) }
  const number = (value: number) => value.toLocaleString(language)
  return <>
    <input ref={inputRef} hidden type="file" accept=".xlsx,.xlsm,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel" onChange={event => readFile(event.target.files?.[0])} />
    <Button variant={compact ? 'secondary' : 'primary'} size={compact ? 'sm' : 'md'} onClick={chooseFile} disabled={parsing} className="excel-import-button">
      {parsing ? <LoaderCircle className="spin" size={15} /> : <FileSpreadsheet size={15} />} {parsing ? l('Analyse…', 'Analyzing…') : l('Importer Excel', 'Import Excel')}
    </Button>
    <Modal open={parsing || Boolean(result)} onClose={close} title={parsing ? l('Analyse approfondie du classeur', 'Deep workbook analysis') : l('Personnaliser avec Excel', 'Personalize with Excel')} description={result ? `${result.fileName} · ${result.sheetCount} ${l('feuille(s)', 'sheet(s)')}` : l('Toutes les feuilles et toutes les lignes utiles sont parcourues localement.', 'Every sheet and every useful row is scanned locally.')} size="lg">
      {parsing && progress && <div className="excel-reading" aria-live="polite">
        <span className="excel-reading-icon"><LoaderCircle className="spin" size={26} /></span>
        <div className="excel-reading-copy"><small>{l('LECTURE EXHAUSTIVE · AUCUNE TRONCATURE', 'COMPLETE SCAN · NO TRUNCATION')}</small><h3>{stageLabel}</h3><p>{progress.sheet ? `${progress.sheet} · ` : ''}{progress.rowsProcessed !== undefined && progress.totalRows !== undefined ? `${number(progress.rowsProcessed)} / ${number(progress.totalRows)} ${l('lignes', 'rows')}` : l('Préparation du moteur d’analyse local…', 'Preparing the local analysis engine…')}</p></div>
        <strong>{progress.percent}%</strong>
        <div className="excel-progress-track" role="progressbar" aria-label={stageLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><i style={{ width: `${progress.percent}%` }} /></div>
        <div className="excel-reading-meta"><span>{progress.sheetCount ? `${progress.sheetsProcessed ?? 0}/${progress.sheetCount} ${l('feuilles', 'sheets')}` : l('Ouverture', 'Opening')}</span><span><LockKeyhole size={12} /> {l('Traitement local', 'Local processing')}</span></div>
        <Button variant="ghost" onClick={stopReading}>{l('Annuler l’analyse', 'Cancel analysis')}</Button>
      </div>}
      {result && <div className="excel-preview">
        <div className="excel-success"><span><FileCheck2 size={22} /></span><div><strong>{l('Classeur analysé intégralement', 'Workbook fully analyzed')}</strong><p>{l(`${number(result.analysis.analyzedSheets)} feuilles et ${number(result.analysis.nonEmptyRows)} lignes utiles parcourues, sans troncature.`, `${number(result.analysis.analyzedSheets)} sheets and ${number(result.analysis.nonEmptyRows)} useful rows scanned, without truncation.`)}</p></div><Badge tone="success"><Check size={11} /> {l('Complet', 'Complete')}</Badge></div>
        <div className="excel-deep-report">
          <header><span><Check size={14} /></span><div><strong>{l('Bilan de lecture approfondie', 'Deep-read report')}</strong><p>{l('Le moteur a parcouru le classeur jusqu’à sa dernière ligne utile.', 'The engine scanned the workbook through its last useful row.')}</p></div><Badge tone="success">{l('0 ligne tronquée', '0 truncated rows')}</Badge></header>
          <div><article><strong>{number(result.analysis.analyzedSheets)}</strong><small>{l('feuilles lues', 'sheets read')}</small></article><article><strong>{number(result.analysis.nonEmptyRows)}</strong><small>{l('lignes parcourues', 'rows scanned')}</small></article><article><strong>{number(result.analysis.totalCells)}</strong><small>{l('cellules renseignées', 'populated cells')}</small></article><article><strong>{number(result.sheetReports.filter(sheet => sheet.status === 'recognized').length)}</strong><small>{l('feuilles reconnues', 'recognized sheets')}</small></article><article><strong>{number(result.sheetReports.filter(sheet => sheet.status !== 'recognized').length)}</strong><small>{l('feuilles ignorées', 'skipped sheets')}</small></article></div>
        </div>
        <section className="excel-preview-section"><header><div><small>01</small><span><strong>{l('Données détectées', 'Detected data')}</strong><p>{l('LifeOS a reconnu automatiquement la structure du classeur.', 'LifeOS automatically recognized the workbook structure.')}</p></span></div></header>
          <div className="excel-count-grid">{counts.map(([key, count]) => <article key={key}><FileSpreadsheet size={16} /><span><strong>{count}</strong><small>{en ? entityLabels[key][1] : entityLabels[key][0]}</small></span></article>)}{result.detectedSheets.filter(sheet => sheet.type === 'profile' || sheet.type === 'settings').map(sheet => <article key={sheet.name}><Sparkles size={16} /><span><strong>{sheet.rows}</strong><small>{en ? sheetLabels[sheet.type][1] : sheetLabels[sheet.type][0]}</small></span></article>)}</div>
          <div className="excel-sheet-list">{result.sheetReports.map(sheet => <span className={`status-${sheet.status}`} key={sheet.name}><i />{sheet.name}<em>{sheet.status === 'recognized' && sheet.type ? `${en ? sheetLabels[sheet.type][1] : sheetLabels[sheet.type][0]} · ${number(sheet.rowsImported)}` : sheet.status === 'empty' ? l('vide · ignorée', 'empty · skipped') : `${l('non reconnue', 'unrecognized')} · ${number(sheet.rowsScanned)} ${l('lignes lues', 'rows read')}`}</em></span>)}</div>
          {result.settingsPatch && Object.keys(result.settingsPatch).length > 0 && <div className="excel-detected-formats"><strong>{l('Formats qui seront appliqués', 'Formats that will be applied')}</strong><div>{result.settingsPatch.currency && <Badge tone="neutral">{l('Devise', 'Currency')} · {result.settingsPatch.currency}</Badge>}{result.settingsPatch.dateFormat && <Badge tone="neutral">{l('Date', 'Date')} · {result.settingsPatch.dateFormat}</Badge>}{result.settingsPatch.decimalSeparator && <Badge tone="neutral">{l('Décimales', 'Decimals')} · 1{result.settingsPatch.decimalSeparator}25</Badge>}{result.settingsPatch.hour12 !== undefined && <Badge tone="neutral">{l('Heure', 'Time')} · {result.settingsPatch.hour12 ? '12 h' : '24 h'}</Badge>}</div></div>}
        </section>
        <section className="excel-preview-section"><header><div><small>02</small><span><strong>{l('Méthode d’import', 'Import method')}</strong><p>{l('Choisissez comment intégrer les lignes reconnues.', 'Choose how to integrate the recognized rows.')}</p></span></div></header>
          <div className="excel-mode-grid"><button className={mode === 'merge' ? 'active' : ''} onClick={() => setMode('merge')}><span className="excel-radio">{mode === 'merge' && <i />}</span><div><strong>{l('Fusionner intelligemment', 'Smart merge')}</strong><p>{l('Ajoute les nouvelles lignes et évite les doublons évidents. Recommandé.', 'Adds new rows and avoids obvious duplicates. Recommended.')}</p></div><Badge tone="success">{l('Recommandé', 'Recommended')}</Badge></button><button className={mode === 'replace' ? 'active' : ''} onClick={() => setMode('replace')}><span className="excel-radio">{mode === 'replace' && <i />}</span><div><strong>{l('Remplacer les données correspondantes', 'Replace matching data')}</strong><p>{l('Remplace seulement les catégories présentes dans ce fichier.', 'Replaces only the categories present in this file.')}</p></div></button></div>
        </section>
        <section className="excel-customize-row"><span><Sparkles size={18} /></span><div><strong>{l('Personnaliser automatiquement le dashboard', 'Automatically personalize the dashboard')}</strong><p>{l('Affiche et remonte les widgets utiles selon le contenu du fichier. Les autres restent disponibles dans la personnalisation.', 'Shows and prioritizes useful widgets based on the file. Others remain available in customization.')}</p></div><Toggle checked={customize} onChange={setCustomize} label={l('Personnaliser automatiquement', 'Personalize automatically')} /></section>
        {result.warnings.length > 0 && <div className="excel-warnings"><AlertTriangle size={16} /><div><strong>{l('Points à vérifier', 'Items to review')}</strong>{result.warnings.slice(0, 4).map(warning => <p key={warning}>{warning}</p>)}</div></div>}
        <div className="excel-privacy"><LockKeyhole size={14} /> {l('Analyse 100 % locale dans un moteur séparé : interface réactive, aucun envoi et aucune limite artificielle de lignes.', '100% local analysis in a separate engine: responsive interface, no upload, and no artificial row limit.')}</div>
        <div className="modal-actions excel-actions"><Button variant="ghost" onClick={() => setResult(undefined)}>{l('Annuler', 'Cancel')}</Button><Button onClick={apply}><Sparkles size={15} /> {l('Importer et personnaliser', 'Import and personalize')}</Button></div>
      </div>}
    </Modal>
  </>
}
