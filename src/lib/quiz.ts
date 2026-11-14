import type { DailySession, Question } from '../types'
import { questionById, questions } from './content'
import { todayStr } from './date'
import { getDailySession, getReview, getReviews, putDailySession, putReview, updateLog } from './db'
import { applyAnswer, buildDailySession } from './srs'

/** 今日のデイリークイズを返す。まだ無ければ作って保存する */
export async function loadDailySession(dailyCount: number): Promise<DailySession> {
  const today = todayStr()
  const saved = await getDailySession()
  if (saved && saved.date === today) {
    // コンテンツ更新で消えた問題は除く
    const ids = saved.questionIds.filter((id) => questionById.has(id))
    return { ...saved, questionIds: ids }
  }
  const session = buildDailySession(questions, await getReviews(), today, dailyCount)
  await putDailySession(session)
  return session
}

export async function recordAnswer(q: Question, correct: boolean, session?: DailySession): Promise<void> {
  const today = todayStr()
  await putReview(applyAnswer(await getReview(q.id), q.id, correct, today, !!session))
  if (!session) return
  session.answers[q.id] = correct
  await putDailySession(session)
  const results = session.questionIds.map((id) => session.answers[id])
  await updateLog(session.date, {
    answeredCount: results.filter((r) => r !== undefined).length,
    correctCount: results.filter((r) => r === true).length,
    quizDone: results.every((r) => r !== undefined),
  })
}
