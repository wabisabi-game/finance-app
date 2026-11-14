import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { CATEGORIES, questionById, termById, terms } from '../lib/content'
import { addDays, parseDate, todayStr } from '../lib/date'
import { getJournal, getLogs, getMastered, getReviews } from '../lib/db'
import { accuracyByCategory, computeStreak, pct, weakTerms } from '../lib/stats'
import { useData } from '../lib/useData'
import type { JournalEntry } from '../types'

const WEEKS = 18

function Stat({ value, unit, label }: { value: string | number; unit?: string; label: string }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold tabular-nums">
        {value}
        {unit && <span className="muted text-sm font-normal">{unit}</span>}
      </p>
      <p className="muted text-xs">{label}</p>
    </div>
  )
}

function Heatmap({ journal, today }: { journal: JournalEntry[]; today: string }) {
  const byDate = new Map(journal.map((e) => [e.date, e]))
  // 今週の土曜日で終わる、日曜始まりの週の列を並べる
  const end = addDays(today, 6 - parseDate(today).getDay())
  const start = addDays(end, -(WEEKS * 7 - 1))
  const weeks = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" role="img" aria-label={`直近${WEEKS}週間の日記の投稿状況`}>
        {weeks.map((week) => {
          const first = parseDate(week[0])
          return (
            <div key={week[0]} className="flex flex-col gap-1">
              <span className="muted h-4 w-3.5 overflow-visible text-[10px] whitespace-nowrap">{first.getDate() <= 7 ? `${first.getMonth() + 1}月` : ''}</span>
              {week.map((day) => {
                const e = byDate.get(day)
                const tone =
                  day > today ? 'bg-transparent'
                  : !e ? 'bg-slate-200 dark:bg-slate-800'
                  : e.review.trim() ? 'bg-emerald-600 dark:bg-emerald-400'
                  : 'bg-emerald-300 dark:bg-emerald-700'
                return <span key={day} title={day} className={`h-3.5 w-3.5 rounded-sm ${tone} ${day === today ? 'ring-1 ring-slate-400' : ''}`} />
              })}
            </div>
          )
        })}
      </div>
      <p className="muted mt-2 flex items-center gap-1.5 text-xs">
        <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800" />なし
        <span className="ml-2 h-3 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />日記あり
        <span className="ml-2 h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />答え合わせ済み
      </p>
    </div>
  )
}

export default function Progress() {
  const today = todayStr()
  const [data] = useData(async () => {
    const [reviews, logs, journal, mastered] = await Promise.all([getReviews(), getLogs(), getJournal(), getMastered()])
    return { reviews, logs, journal, mastered }
  })
  if (!data) return <PageHeader title="進捗" />

  const { reviews, logs, journal, mastered } = data
  const todayLog = logs.find((l) => l.date === today)
  const byCategory = accuracyByCategory(reviews, questionById, termById)
  const overall = pct({
    seen: reviews.reduce((s, r) => s + r.seen, 0),
    correct: reviews.reduce((s, r) => s + r.correct, 0),
  })
  const weak = weakTerms(reviews, questionById)
  const weekStart = addDays(today, -6)
  const journalThisWeek = journal.filter((e) => e.date >= weekStart && e.date <= today && e.explanation.trim()).length

  return (
    <>
      <PageHeader title="進捗" />

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat value={computeStreak(logs, today)} unit="日" label="連続学習（目標30日）" />
        <Stat value={overall ?? '—'} unit={overall === null ? '' : '%'} label="正答率（目標80%）" />
        <Stat value={journalThisWeek} unit="本" label="直近7日の日記（目標5本）" />
        <Stat value={`${mastered.size}/${terms.length}`} label="覚えた用語" />
      </div>

      <section className="card mb-3">
        <h2 className="label">今日のタスク</h2>
        <ul className="space-y-1 text-sm">
          <li>{todayLog?.quizDone ? '✓' : '・'} デイリークイズ{todayLog ? `（${todayLog.correctCount} / ${todayLog.answeredCount} 問正解）` : ''}</li>
          <li>{todayLog?.journalDone ? '✓' : '・'} マーケット日記</li>
        </ul>
      </section>

      <section className="card mb-3">
        <h2 className="label">分野別の正答率</h2>
        <ul className="space-y-3">
          {CATEGORIES.map((c) => {
            const a = byCategory.get(c.id)
            const p = pct(a)
            return (
              <li key={c.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="tabular-nums">{p === null ? <span className="muted">未回答</span> : <>{p}% <span className="muted text-xs">（{a!.correct}/{a!.seen}）</span></>}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${p !== null && p < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p ?? 0}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card mb-3">
        <h2 className="label">苦手用語トップ10</h2>
        {weak.length === 0 ? (
          <p className="muted text-sm">まだ間違えた問題がありません。</p>
        ) : (
          <ol className="divide-y divide-slate-200 dark:divide-slate-800">
            {weak.map((w, i) => (
              <li key={w.termId}>
                <Link to={`/dictionary/${w.termId}`} className="flex min-h-11 items-center gap-3 py-1.5 text-sm">
                  <span className="muted w-5 text-right tabular-nums">{i + 1}</span>
                  <span className="flex-1">{termById.get(w.termId)?.nameJa ?? w.termId}</span>
                  <span className="tabular-nums">{pct(w)}% <span className="muted text-xs">（{w.correct}/{w.seen}）</span></span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <h2 className="label">日記の投稿</h2>
        <Heatmap journal={journal} today={today} />
      </section>
    </>
  )
}
