/// <reference lib="webworker" />

import type { ExcelImportProgress } from '../types'
import { parseExcelWorkbook } from '../utils/excelImporter'

type ImportRequest = { file: File; language: 'fr' | 'en' }

type WorkerScope = typeof globalThis & {
  postMessage(message: unknown): void
  onmessage: ((event: MessageEvent<ImportRequest>) => void) | null
}

const worker = self as unknown as WorkerScope

worker.onmessage = async ({ data }) => {
  try {
    const payload = await parseExcelWorkbook(data.file, data.language, (progress: ExcelImportProgress) => {
      worker.postMessage({ type: 'progress', progress })
    })
    worker.postMessage({ type: 'complete', payload })
  } catch (error) {
    worker.postMessage({ type: 'error', error: error instanceof Error ? error.message : 'read' })
  }
}
