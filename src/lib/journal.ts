import { PRICE_KEYS, type JournalEntry, type PriceKey } from '../types'

export const PRICE_FIELDS: { key: PriceKey; label: string; short: string; unit: string }[] = [
  { key: 'nikkei', label: '日経平均', short: '日経', unit: '円' },
  { key: 'spx', label: 'S&P500', short: 'S&P', unit: '' },
  { key: 'ust10y', label: '米10年債利回り', short: '米10年', unit: '%' },
  { key: 'usdjpy', label: 'ドル円', short: 'ドル円', unit: '円' },
  { key: 'wti', label: 'WTI原油', short: 'WTI', unit: 'ドル' },
  { key: 'vix', label: 'VIX', short: 'VIX', unit: '' },
]

export function emptyEntry(date: string): JournalEntry {
  return {
    date,
    prices: Object.fromEntries(PRICE_KEYS.map((k) => [k, { close: null, change: null }])) as JournalEntry['prices'],
    news: [],
    explanation: '',
    confidence: 3,
    review: '',
    tags: [],
    updatedAt: '',
  }
}

/** 「38,500.25」「＋120」「-0.05」などの入力を数値にする。空や不正な値は null */
export function parseNumber(s: string): number | null {
  const normalized = s
    .normalize('NFKC')
    .replace(/[,\s]/g, '')
    .replace(/[−–—ー]/g, '-')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null
  return Number(normalized)
}

export function formatNumber(n: number | null): string {
  return n === null ? '' : n.toLocaleString('ja-JP', { maximumFractionDigits: 3 })
}

export function formatChange(n: number | null): string {
  if (n === null) return ''
  return `${n > 0 ? '+' : n < 0 ? '−' : '±'}${formatNumber(Math.abs(n))}`
}

export function parseTags(s: string): string[] {
  return [...new Set(s.split(/[\s,、#＃]+/).filter(Boolean))]
}

export function hasContent(e: JournalEntry): boolean {
  return (
    e.news.length > 0 ||
    !!e.explanation.trim() ||
    !!e.review.trim() ||
    e.tags.length > 0 ||
    PRICE_KEYS.some((k) => e.prices[k].close !== null || e.prices[k].change !== null)
  )
}

export function matchesQuery(e: JournalEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [e.date, e.explanation, e.review, ...e.news, ...e.tags].some((s) => s.toLowerCase().includes(q))
}
