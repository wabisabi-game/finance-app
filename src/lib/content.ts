import type { Category, Question, Term } from '../types'

// /content 以下のJSONをすべて読み込む。ファイルを足すだけで用語・問題が増える
const termFiles = import.meta.glob<Term[]>('../../content/terms/*.json', { eager: true, import: 'default' })
const questionFiles = import.meta.glob<Question[]>('../../content/questions/*.json', {
  eager: true,
  import: 'default',
})

export const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'rates', label: '金利・債券', color: '#4f8ef7' },
  { id: 'macro', label: '金融政策・マクロ', color: '#9b6cf2' },
  { id: 'equity', label: '株式', color: '#2bb673' },
  { id: 'fx', label: '為替', color: '#f08c3a' },
  { id: 'credit', label: 'クレジット・デリバティブ', color: '#e2557f' },
  { id: 'career', label: '業界・就活用語', color: '#8a94a6' },
]

export const categoryColor = (id: Category): string => CATEGORIES.find((c) => c.id === id)?.color ?? '#8a94a6'

export const categoryLabel = (id: Category): string => CATEGORIES.find((c) => c.id === id)?.label ?? id

const order = new Map(CATEGORIES.map((c, i) => [c.id, i]))

export const terms: Term[] = Object.values(termFiles)
  .flat()
  .sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99))
export const questions: Question[] = Object.values(questionFiles).flat()

export const termById = new Map(terms.map((t) => [t.id, t]))
export const questionById = new Map(questions.map((q) => [q.id, q]))

export function questionsForTerm(termId: string): Question[] {
  return questions.filter((q) => q.termId === termId)
}

export function questionsForCategory(category: Category): Question[] {
  return questions.filter((q) => termById.get(q.termId)?.category === category)
}

export function searchTerms(query: string, category: Category | 'all'): Term[] {
  const q = query.trim().toLowerCase()
  return terms.filter((t) => {
    if (category !== 'all' && t.category !== category) return false
    if (!q) return true
    return t.nameJa.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q)
  })
}
