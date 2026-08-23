import type { StateStorage } from 'zustand/middleware'

const DATABASE = 'lifeos-local-data'
const STORE = 'zustand-state'

function localFallback(): StateStorage {
  return {
    getItem: name => typeof localStorage === 'undefined' ? null : localStorage.getItem(name),
    setItem: (name, value) => { if (typeof localStorage !== 'undefined') localStorage.setItem(name, value) },
    removeItem: name => { if (typeof localStorage !== 'undefined') localStorage.removeItem(name) },
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function read(name: string): Promise<string | null> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(name)
    request.onsuccess = () => { database.close(); resolve(typeof request.result === 'string' ? request.result : null) }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

async function write(name: string, value: string): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(value, name)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error) }
  })
}

async function remove(name: string): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).delete(name)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error) }
  })
}

const fallback = localFallback()

/** IndexedDB removes localStorage's small quota for deep Excel imports and migrates existing data on first load. */
export const indexedDbStorage: StateStorage = {
  getItem: async name => {
    if (typeof indexedDB === 'undefined') return fallback.getItem(name)
    try {
      const saved = await read(name)
      if (saved !== null) return saved
      const legacy = await fallback.getItem(name)
      if (legacy !== null) await write(name, legacy)
      return legacy
    } catch { return fallback.getItem(name) }
  },
  setItem: async (name, value) => {
    if (typeof indexedDB === 'undefined') return fallback.setItem(name, value)
    try { await write(name, value) } catch { await fallback.setItem(name, value) }
  },
  removeItem: async name => {
    if (typeof indexedDB === 'undefined') return fallback.removeItem(name)
    try { await remove(name) } finally { await fallback.removeItem(name) }
  },
}
