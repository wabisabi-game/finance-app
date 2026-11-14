import type { Settings } from '../types'
import type { UserData } from './db'

export interface Backup extends UserData {
  app: 'finance-app'
  version: 1
  exportedAt: string
  settings?: Settings
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** インポートするJSONの形を確かめる。壊れたファイルで既存データを消さないため */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSONとして読み込めませんでした')
  }
  if (!isObj(data) || data.app !== 'finance-app' || data.version !== 1) {
    throw new Error('このアプリのバックアップファイルではありません')
  }
  const { reviews, journal, logs, mastered } = data
  const ok =
    Array.isArray(reviews) &&
    reviews.every((r) => isObj(r) && typeof r.questionId === 'string' && typeof r.nextDue === 'string') &&
    Array.isArray(journal) &&
    journal.every((e) => isObj(e) && typeof e.date === 'string' && isObj(e.prices) && Array.isArray(e.news)) &&
    Array.isArray(logs) &&
    logs.every((l) => isObj(l) && typeof l.date === 'string') &&
    Array.isArray(mastered) &&
    mastered.every((m) => typeof m === 'string')
  if (!ok) throw new Error('バックアップの中身が壊れています')
  return data as unknown as Backup
}
