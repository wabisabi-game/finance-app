import type { Category, Question, ReviewState, StudyLog, Term } from '../types'
import { addDays } from './date'

const isActive = (l: StudyLog | undefined) => !!l && (l.quizDone || l.journalDone)

/** 連続学習日数。今日まだ何もしていなければ、昨日までの連続を数える */
export function computeStreak(logs: readonly StudyLog[], today: string): number {
  const byDate = new Map(logs.map((l) => [l.date, l]))
  let day = isActive(byDate.get(today)) ? today : addDays(today, -1)
  let n = 0
  while (isActive(byDate.get(day))) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export interface Accuracy {
  seen: number
  correct: number
}

export function accuracyByCategory(
  reviews: readonly ReviewState[],
  questionById: ReadonlyMap<string, Question>,
  termById: ReadonlyMap<string, Term>,
): Map<Category, Accuracy> {
  const out = new Map<Category, Accuracy>()
  for (const r of reviews) {
    const q = questionById.get(r.questionId)
    const cat = q && termById.get(q.termId)?.category
    if (!cat) continue
    const a = out.get(cat) ?? { seen: 0, correct: 0 }
    a.seen += r.seen
    a.correct += r.correct
    out.set(cat, a)
  }
  return out
}

export interface WeakTerm extends Accuracy {
  termId: string
}

/** 間違えたことのある用語を、正答率の低い順に並べる */
export function weakTerms(
  reviews: readonly ReviewState[],
  questionById: ReadonlyMap<string, Question>,
  limit = 10,
): WeakTerm[] {
  const byTerm = new Map<string, WeakTerm>()
  for (const r of reviews) {
    const q = questionById.get(r.questionId)
    if (!q) continue
    const w = byTerm.get(q.termId) ?? { termId: q.termId, seen: 0, correct: 0 }
    w.seen += r.seen
    w.correct += r.correct
    byTerm.set(q.termId, w)
  }
  return [...byTerm.values()]
    .filter((w) => w.correct < w.seen)
    .sort((a, b) => a.correct / a.seen - b.correct / b.seen || b.seen - a.seen)
    .slice(0, limit)
}

export const pct = (a: Accuracy | undefined): number | null =>
  a && a.seen > 0 ? Math.round((a.correct / a.seen) * 100) : null
