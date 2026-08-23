import { useRef, useState } from 'react'
import { AlertTriangle, Check, FileCheck2, FileSpreadsheet, LoaderCircle, LockKeyhole, Sparkles, Upload } from 'lucide-react'
import { useLifeStore } from '../../store/useLifeStore'
import type { ExcelDataType, ExcelImportMode, ExcelImportPayload } from '../../types'
import { parseExcelWorkbook } from '../../utils/excelImporter'
import { Badge, Button, Modal, Toggle } from '../ui/primitives'

const entityLabels: Record<Exclude<ExcelDataType, 'profile' | 'settings'>, [string, string]> = {
  transactions: ['Transactions', 'Transactions'], budgets: ['Budgets', 'Budgets'], tasks: ['Tâches', 'Tasks'], goals: ['Objectifs', 'Goals'],
  savings: ['Épargne', 'Savings'], investments: ['Investissements', 'Investments'], events: ['Événements', 'Events'], notes: ['Notes', 'Notes'], habits: ['Habitudes', 'Habits'],
}
const sheetLabels: Record<ExcelDataType, [string, string]> = { ...entityLabels, profile: ['Profil', 'Profile'], settings: ['Préférences', 'Preferences'] }

export function ExcelImporter({ compact = false }: { compact?: boolean }) {
  const language = useLifeStore(state => state.settings.language); const en = language === 'en'; const l = (fr: string, english: string) => en ? english : fr
  const applyImport = useLifeStore(state => state.applyExcelImport); const pushToast = useLifeStore(state => state.pushToast)
  const inputRef = useRef<HTMLInputElement>(null); const [result, setResult] = useState<ExcelImportPayload>(); const [parsing, setParsing] = useState(false)
  const [mode, setMode] = useState<ExcelImportMode>('merge'); const [customize, setCustomize] = useState(true)

  const chooseFile = () => inputRef.current?.click()
  const readFile = async (file?: File) => {
    if (!file) return
    setParsing(true)
    try {
      const parsed = await parseExcelWorkbook(file, language)
      setResult(parsed); setMode('merge'); setCustomize(true)
    } catch (error) {
      const reason = error instanceof Error ? error.message : ''
      const message = reason === 'format'
        ? l('Utilisez un classeur Excel au format .xlsx, .xlsm ou .xls.', 'Use an Excel workbook in .xlsx, .xlsm, or .xls format.')
        : reason === 'size'
          ? l('Le fichier dépasse la limite locale de 25 Mo.', 'The file exceeds the 25 MB local limit.')
          : reason === 'empty'
            ? l('Aucune colonne reconnue. Vérifiez les titres de vos feuilles.', 'No recognized columns. Check your sheet headers.')
            : l('Le classeur est illisible ou protégé par un mot de passe.', 'The workbook is unreadable or password-protected.')
      pushToast({ title: l('Import Excel impossible', 'Excel import failed'), message, tone: 'danger' })
    } finally {
      setParsing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  const apply = () => {
    if (!result) return
    applyImport(result, mode, customize); setResult(undefined)
  }
  const counts = result ? Object.entries(result.counts).filter(([, count]) => count > 0) as [keyof typeof result.counts, number][] : []
  return <>
    <input ref={inputRef} hidden type="file" accept=".xlsx,.xlsm,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel" onChange={event => readFile(event.target.files?.[0])} />
    <Button variant={compact ? 'secondary' : 'primary'} size={compact ? 'sm' : 'md'} onClick={chooseFile} disabled={parsing} className="excel-import-button">
      {parsing ? <LoaderCircle className="spin" size={15} /> : <FileSpreadsheet size={15} />} {parsing ? l('Analyse…', 'Analyzing…') : l('Importer Excel', 'Import Excel')}
    </Button>
    <Modal open={Boolean(result)} onClose={() => setResult(undefined)} title={l('Personnaliser avec Excel', 'Personalize with Excel')} description={result ? `${result.fileName} · ${result.sheetCount} ${l('feuille(s)', 'sheet(s)')}` : undefined} size="lg">
      {result && <div className="excel-preview">
        <div className="excel-success"><span><FileCheck2 size={22} /></span><div><strong>{l('Classeur analysé avec succès', 'Workbook analyzed successfully')}</strong><p>{l(`${result.detectedSheets.length} feuilles reconnues et ${result.rowCount} lignes analysées.`, `${result.detectedSheets.length} sheets recognized and ${result.rowCount} rows analyzed.`)}</p></div><Badge tone="success"><Check size={11} /> {l('Prêt', 'Ready')}</Badge></div>
        <section className="excel-preview-section"><header><div><small>01</small><span><strong>{l('Données détectées', 'Detected data')}</strong><p>{l('LifeOS a reconnu automatiquement la structure du classeur.', 'LifeOS automatically recognized the workbook structure.')}</p></span></div></header>
          <div className="excel-count-grid">{counts.map(([key, count]) => <article key={key}><FileSpreadsheet size={16} /><span><strong>{count}</strong><small>{en ? entityLabels[key][1] : entityLabels[key][0]}</small></span></article>)}{result.detectedSheets.filter(sheet => sheet.type === 'profile' || sheet.type === 'settings').map(sheet => <article key={sheet.name}><Sparkles size={16} /><span><strong>{sheet.rows}</strong><small>{en ? sheetLabels[sheet.type][1] : sheetLabels[sheet.type][0]}</small></span></article>)}</div>
          <div className="excel-sheet-list">{result.detectedSheets.map(sheet => <span key={`${sheet.name}-${sheet.type}`}><i />{sheet.name}<em>{en ? sheetLabels[sheet.type][1] : sheetLabels[sheet.type][0]} · {sheet.rows}</em></span>)}</div>
          {result.settingsPatch && Object.keys(result.settingsPatch).length > 0 && <div className="excel-detected-formats"><strong>{l('Formats qui seront appliqués', 'Formats that will be applied')}</strong><div>{result.settingsPatch.currency && <Badge tone="neutral">{l('Devise', 'Currency')} · {result.settingsPatch.currency}</Badge>}{result.settingsPatch.dateFormat && <Badge tone="neutral">{l('Date', 'Date')} · {result.settingsPatch.dateFormat}</Badge>}{result.settingsPatch.decimalSeparator && <Badge tone="neutral">{l('Décimales', 'Decimals')} · 1{result.settingsPatch.decimalSeparator}25</Badge>}{result.settingsPatch.hour12 !== undefined && <Badge tone="neutral">{l('Heure', 'Time')} · {result.settingsPatch.hour12 ? '12 h' : '24 h'}</Badge>}</div></div>}
        </section>
        <section className="excel-preview-section"><header><div><small>02</small><span><strong>{l('Méthode d’import', 'Import method')}</strong><p>{l('Choisissez comment intégrer les lignes reconnues.', 'Choose how to integrate the recognized rows.')}</p></span></div></header>
          <div className="excel-mode-grid"><button className={mode === 'merge' ? 'active' : ''} onClick={() => setMode('merge')}><span className="excel-radio">{mode === 'merge' && <i />}</span><div><strong>{l('Fusionner intelligemment', 'Smart merge')}</strong><p>{l('Ajoute les nouvelles lignes et évite les doublons évidents. Recommandé.', 'Adds new rows and avoids obvious duplicates. Recommended.')}</p></div><Badge tone="success">{l('Recommandé', 'Recommended')}</Badge></button><button className={mode === 'replace' ? 'active' : ''} onClick={() => setMode('replace')}><span className="excel-radio">{mode === 'replace' && <i />}</span><div><strong>{l('Remplacer les données correspondantes', 'Replace matching data')}</strong><p>{l('Remplace seulement les catégories présentes dans ce fichier.', 'Replaces only the categories present in this file.')}</p></div></button></div>
        </section>
        <section className="excel-customize-row"><span><Sparkles size={18} /></span><div><strong>{l('Personnaliser automatiquement le dashboard', 'Automatically personalize the dashboard')}</strong><p>{l('Affiche et remonte les widgets utiles selon le contenu du fichier. Les autres restent disponibles dans la personnalisation.', 'Shows and prioritizes useful widgets based on the file. Others remain available in customization.')}</p></div><Toggle checked={customize} onChange={setCustomize} label={l('Personnaliser automatiquement', 'Personalize automatically')} /></section>
        {result.warnings.length > 0 && <div className="excel-warnings"><AlertTriangle size={16} /><div><strong>{l('Points à vérifier', 'Items to review')}</strong>{result.warnings.slice(0, 4).map(warning => <p key={warning}>{warning}</p>)}</div></div>}
        <div className="excel-privacy"><LockKeyhole size={14} /> {l('Analyse 100 % locale : le fichier ne quitte jamais votre navigateur.', '100% local analysis: the file never leaves your browser.')}</div>
        <div className="modal-actions excel-actions"><Button variant="ghost" onClick={() => setResult(undefined)}>{l('Annuler', 'Cancel')}</Button><Button onClick={apply}><Sparkles size={15} /> {l('Importer et personnaliser', 'Import and personalize')}</Button></div>
      </div>}
    </Modal>
  </>
}
