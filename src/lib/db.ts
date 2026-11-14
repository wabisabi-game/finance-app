import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DailySession, JournalEntry, ReviewState, StudyLog } from '../types'

interface AppDB extends DBSchema {
  reviews: { key: string; value: ReviewState }
  journal: { key: string; value: JournalEntry }
  logs: { key: string; value: StudyLog }
  mastered: { key: string; value: { termId: string } }
  meta: { key: string; value: DailySession }
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | undefined

function db(): Promise<IDBPDatabase<AppDB>> {
  dbPromise ??= openDB<AppDB>('finance-app', 1, {
    upgrade(d) {
      d.createObjectStore('reviews', { keyPath: 'questionId' })
      d.createObjectStore('journal', { keyPath: 'date' })
      d.createObjectStore('logs', { keyPath: 'date' })
      d.createObjectStore('mastered', { keyPath: 'termId' })
      d.createObjectStore('meta')
    },
  })
  return dbPromise
}

export const getReviews = async () => (await db()).getAll('reviews')
export const getReview = async (id: string) => (await db()).get('reviews', id)
export const putReview = async (r: ReviewState) => void (await (await db()).put('reviews', r))

export const getJournal = async () => (await db()).getAll('journal')
export const getEntry = async (date: string) => (await db()).get('journal', date)
export const putEntry = async (e: JournalEntry) => void (await (await db()).put('journal', e))
export const deleteEntry = async (date: string) => (await db()).delete('journal', date)

export const getLogs = async () => (await db()).getAll('logs')

export async function updateLog(date: string, patch: Partial<Omit<StudyLog, 'date'>>): Promise<void> {
  const d = await db()
  const tx = d.transaction('logs', 'readwrite')
  const prev = (await tx.store.get(date)) ?? {
    date,
    quizDone: false,
    correctCount: 0,
    answeredCount: 0,
    journalDone: false,
  }
  await tx.store.put({ ...prev, ...patch })
  await tx.done
}

export const getMastered = async () => new Set(await (await db()).getAllKeys('mastered'))
export async function setMastered(termId: string, on: boolean): Promise<void> {
  const d = await db()
  if (on) await d.put('mastered', { termId })
  else await d.delete('mastered', termId)
}

export const getDailySession = async () => (await db()).get('meta', 'dailySession')
export const putDailySession = async (s: DailySession) => void (await (await db()).put('meta', s, 'dailySession'))

export interface UserData {
  reviews: ReviewState[]
  journal: JournalEntry[]
  logs: StudyLog[]
  mastered: string[]
}

export async function exportAll(): Promise<UserData> {
  const d = await db()
  return {
    reviews: await d.getAll('reviews'),
    journal: await d.getAll('journal'),
    logs: await d.getAll('logs'),
    mastered: await d.getAllKeys('mastered'),
  }
}

/** 既存のユーザーデータをすべて置き換える */
export async function replaceAll(data: UserData): Promise<void> {
  const d = await db()
  const tx = d.transaction(['reviews', 'journal', 'logs', 'mastered', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('reviews').clear(),
    tx.objectStore('journal').clear(),
    tx.objectStore('logs').clear(),
    tx.objectStore('mastered').clear(),
    tx.objectStore('meta').clear(),
  ])
  for (const r of data.reviews) void tx.objectStore('reviews').put(r)
  for (const e of data.journal) void tx.objectStore('journal').put(e)
  for (const l of data.logs) void tx.objectStore('logs').put(l)
  for (const termId of data.mastered) void tx.objectStore('mastered').put({ termId })
  await tx.done
}
