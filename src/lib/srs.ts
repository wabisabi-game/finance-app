import type { DailySession, Question, ReviewState } from '../types'
import { addDays } from './date'

/** 正解するたびに次の出題までの間隔を延ばす（日数） */
export const INTERVALS = [1, 3, 7, 14, 30]

/** 1日の出題のうち新規問題が占める割合（10問なら新規3＋復習7） */
export const NEW_RATIO = 0.3

/**
 * 回答を復習状態に反映する。
 * - デイリー（schedule=true）：正解で間隔を1→3→7→14→30日と延ばし、不正解で1日に戻す
 * - 自主演習（schedule=false）：正解しても間隔は延ばさない。不正解なら1日に戻す
 */
export function applyAnswer(
  prev: ReviewState | undefined,
  questionId: string,
  correct: boolean,
  today: string,
  schedule = true,
): ReviewState {
  const base: ReviewState = prev ?? {
    questionId,
    intervalDays: 0,
    nextDue: today,
    correctStreak: 0,
    lastAnsweredAt: today,
    seen: 0,
    correct: 0,
  }
  const next: ReviewState = {
    ...base,
    lastAnsweredAt: today,
    seen: base.seen + 1,
    correct: base.correct + (correct ? 1 : 0),
  }
  if (!correct) {
    next.correctStreak = 0
    next.intervalDays = 1
    next.nextDue = addDays(today, 1)
  } else if (schedule) {
    next.correctStreak = base.correctStreak + 1
    next.intervalDays = INTERVALS[Math.min(next.correctStreak, INTERVALS.length) - 1]
    next.nextDue = addDays(today, next.intervalDays)
  } else if (!prev) {
    next.intervalDays = 1
    next.nextDue = addDays(today, 1)
  }
  return next
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 今日の出題を決める。復習（期日が来たもの）と新規を混ぜ、足りない分はもう一方で埋める */
export function buildDailySession(
  questions: readonly Question[],
  reviews: readonly ReviewState[],
  today: string,
  dailyCount: number,
  random: () => number = Math.random,
): DailySession {
  const known = new Set(questions.map((q) => q.id))
  const stateIds = new Set(reviews.map((r) => r.questionId))
  const due = reviews
    .filter((r) => known.has(r.questionId) && r.nextDue <= today)
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
    .map((r) => r.questionId)
  const unseen = shuffle(
    questions.filter((q) => !stateIds.has(q.id)).map((q) => q.id),
    random,
  )

  const newTarget = Math.round(dailyCount * NEW_RATIO)
  const reviewTarget = dailyCount - newTarget
  let reviewPick = due.slice(0, reviewTarget)
  let newPick = unseen.slice(0, newTarget)
  const shortage = dailyCount - reviewPick.length - newPick.length
  if (shortage > 0) {
    if (reviewPick.length < reviewTarget) newPick = unseen.slice(0, newPick.length + shortage)
    else reviewPick = due.slice(0, reviewPick.length + shortage)
  }
  return { date: today, questionIds: shuffle([...reviewPick, ...newPick], random), answers: {} }
}
