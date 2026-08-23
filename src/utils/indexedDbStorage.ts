import type { PersistStorage, StorageValue } from 'zustand/middleware'

const DATABASE = 'lifeos-local-data'
const STORE = 'zustand-state'
const WRITE_DELAY_MS = 75

let databasePromise: Promise<IDBDatabase> | undefined

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => { database.close(); databasePromise = undefined }
      resolve(database)
    }
    request.onerror = () => { databasePromise = undefined; reject(request.error) }
    request.onblocked = () => { databasePromise = undefined; reject(new Error('IndexedDB upgrade blocked')) }
  })
  return databasePromise
}

async function readRecord(name: string): Promise<unknown> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(name)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

async function writeRecord(name: string, value: unknown): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(value, name)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function removeRecord(name: string): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).delete(name)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function parseStored<S>(value: unknown): StorageValue<S> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value
    return parsed && typeof parsed === 'object' && 'state' in parsed ? parsed as StorageValue<S> : null
  } catch { return null }
}

function readFallback<S>(name: string): StorageValue<S> | null {
  if (typeof localStorage === 'undefined') return null
  try { return parseStored<S>(localStorage.getItem(name)) } catch { return null }
}

function writeFallback<S>(name: string, value: StorageValue<S>) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(name, JSON.stringify(value))
}

interface QueuedWrite<S> {
  value: StorageValue<S>
  timer: ReturnType<typeof setTimeout>
  done: Array<() => void>
}

const queuedWrites = new Map<string, QueuedWrite<unknown>>()

async function commitQueued(name: string, queued: QueuedWrite<unknown>) {
  if (queuedWrites.get(name) !== queued) return
  queuedWrites.delete(name)
  try {
    await writeRecord(name, queued.value)
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name)
  } catch {
    try { writeFallback(name, queued.value) } catch { /* Storage may be disabled or full. */ }
  } finally {
    queued.done.forEach(resolve => resolve())
  }
}

function queueWrite<S>(name: string, value: StorageValue<S>): Promise<void> {
  return new Promise(resolve => {
    const current = queuedWrites.get(name)
    if (current) {
      clearTimeout(current.timer)
      current.value = value as StorageValue<unknown>
      current.done.push(resolve)
      current.timer = setTimeout(() => void commitQueued(name, current), WRITE_DELAY_MS)
      return
    }
    let queued: QueuedWrite<unknown>
    queued = {
      value: value as StorageValue<unknown>,
      done: [resolve],
      timer: setTimeout(() => void commitQueued(name, queued), WRITE_DELAY_MS),
    }
    queuedWrites.set(name, queued)
  })
}

function flushQueuedWrites() {
  for (const [name, queued] of queuedWrites) {
    clearTimeout(queued.timer)
    void commitQueued(name, queued)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushQueuedWrites)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushQueuedWrites() })
}

/**
 * Persists structured Zustand snapshots directly in IndexedDB. A short coalescing
 * window avoids cloning a deep Excel-backed state for every rapid UI update.
 * Existing JSON snapshots from IndexedDB/localStorage are migrated transparently.
 */
export function createIndexedDbStorage<S>(): PersistStorage<S> {
  return {
    getItem: async name => {
      const queued = queuedWrites.get(name)
      if (queued) return queued.value as StorageValue<S>
      if (typeof indexedDB === 'undefined') return readFallback<S>(name)
      try {
        const raw = await readRecord(name)
        const saved = parseStored<S>(raw)
        if (saved) {
          if (typeof raw === 'string') await writeRecord(name, saved)
          return saved
        }
        const legacy = readFallback<S>(name)
        if (legacy) {
          await writeRecord(name, legacy)
          try { localStorage.removeItem(name) } catch { /* Keep migration non-blocking. */ }
        }
        return legacy
      } catch { return readFallback<S>(name) }
    },
    setItem: (name, value) => {
      if (typeof indexedDB === 'undefined') {
        try { writeFallback(name, value) } catch { /* Storage may be disabled or full. */ }
        return
      }
      return queueWrite(name, value)
    },
    removeItem: async name => {
      const queued = queuedWrites.get(name)
      if (queued) {
        clearTimeout(queued.timer)
        queuedWrites.delete(name)
        queued.done.forEach(resolve => resolve())
      }
      if (typeof indexedDB !== 'undefined') {
        try { await removeRecord(name) } catch { /* Fallback is still cleared below. */ }
      }
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem(name) } catch { /* Ignore restricted storage. */ }
    },
  }
}


/** Clears the local persistence database after a fatal boot/render error. */
export async function clearIndexedDbStorage() {
  for (const [, queued] of queuedWrites) {
    clearTimeout(queued.timer)
    queued.done.forEach(resolve => resolve())
  }
  queuedWrites.clear()
  try {
    const database = await databasePromise
    database?.close()
  } catch { /* The database may never have opened. */ }
  databasePromise = undefined
  try {
    await new Promise<void>(resolve => {
      const request = indexedDB.deleteDatabase(DATABASE)
      const finish = () => resolve()
      request.onsuccess = finish; request.onerror = finish; request.onblocked = finish
    })
  } catch { /* IndexedDB can be blocked by browser privacy settings. */ }
  try {
    Object.keys(localStorage).filter(key => key.startsWith('lifeos')).forEach(key => localStorage.removeItem(key))
  } catch { /* localStorage may be unavailable. */ }
}
