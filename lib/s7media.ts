
const DB_NAME = "s7media.v1"
const STORE = "media"

export interface MediaRecordMeta {
  id: string
  name: string
  type: string
  category?: string
  createdAt: number
}

export interface MediaRecord extends MediaRecordMeta {
  blob: Blob
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" })
        store.createIndex("by_createdAt", "createdAt")
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFile(category: string, file: File): Promise<MediaRecordMeta> {
  const db = await openDB()
  const id = `med_${Math.random().toString(36).slice(2)}_${Date.now()}`
  const rec: MediaRecord = {
    id,
    name: file.name,
    type: file.type || "application/octet-stream",
    category,
    blob: file,
    createdAt: Date.now(),
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).put(rec)
  })
  db.close()
  return { id, name: rec.name, type: rec.type, category, createdAt: rec.createdAt }
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).delete(id)
  })
  db.close()
}

export async function getFile(id: string): Promise<MediaRecord | null> {
  const db = await openDB()
  const rec = await new Promise<MediaRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    tx.onerror = () => reject(tx.error)
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve((req.result as MediaRecord) || null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return rec
}

export async function getObjectUrl(id: string): Promise<string | null> {
  const rec = await getFile(id)
  if (!rec) return null
  return URL.createObjectURL(rec.blob)
}
