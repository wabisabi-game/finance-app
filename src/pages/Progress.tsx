import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { CATEGORIES, questionById, termById, terms } from '../lib/content'
import { addDays, parseDate, todayStr } from '../lib/date'
import { getJournal, getLogs, getMastered, getReviews } from '../lib/db'
import { accuracyByCategory, computeStreak, pct, weakTerms } from '../lib/stats'
import { useData } from '../lib/useData'
import type { JournalEntry } from '../types'

const WEEKS = 18

function Stat({ value, unit, label, goal, ratio }: { value: string | number; unit?: string; label: string; goal: string; ratio: number }) {
  const reached = ratio >= 1
  return (
    <div className="card p-4">
      <p className="muted text-xs font-bold">{label}</p>
      <p className="mt-1 text-3xl leading-tight font-bold tracking-tight tabular-nums">
        {value}
        {unit && <span className="muted ml-0.5 text-sm font-semibold">{unit}</span>}
      </p>
      <div className="bg-raised mt-3 h-1.5 overflow-hidden rounded-full">
        <div className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-good' : 'bg-accent'}`} style={{ width: `${Math.min(1, ratio) * 100}%` }} />
      </div>
      <p className={`mt-1.5 text-[11px] leading-none font-semibold ${reached ? 'text-good' : 'text-sub'}`}>{reached ? '目標達成' : goal}</p>
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
    <div>
      <div className="flex max-w-md gap-1" role="img" aria-label={`直近${WEEKS}週間の日記の投稿状況`}>
        {weeks.map((week) => {
          const first = parseDate(week[0])
          return (
            <div key={week[0]} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="muted h-4 w-0 overflow-visible text-[10px] whitespace-nowrap">{first.getDate() <= 7 ? `${first.getMonth() + 1}月` : ''}</span>
              {week.map((day) => {
                const e = byDate.get(day)
                const tone =
                  day > today ? 'bg-transparent'
                  : !e ? 'bg-raised'
                  : e.review.trim() ? 'bg-accent'
                  : 'bg-accent/40'
                return <span key={day} title={day} className={`aspect-square w-full rounded-[4px] ${tone} ${day === today ? 'ring-sub ring-1 ring-offset-1 ring-offset-[var(--surface)]' : ''}`} />
              })}
            </div>
          )
        })}
      </div>
      <p className="muted mt-2 flex items-center gap-1.5 text-xs">
        <span className="h-3 w-3 rounded-sm bg-raised" />なし
        <span className="ml-2 h-3 w-3 rounded-sm bg-accent/40" />日記あり
        <span className="ml-2 h-3 w-3 rounded-sm bg-accent" />答え合わせ済み
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
  const streak = computeStreak(logs, today)
  const weekStart = addDays(today, -6)
  const journalThisWeek = journal.filter((e) => e.date >= weekStart && e.date <= today && e.explanation.trim()).length

  return (
    <>
      <PageHeader title="進捗" />

      <div className="mb-3 grid grid-cols-2 gap-3">
        <Stat value={streak} unit="日" label="連続学習" goal="目標 30日" ratio={streak / 30} />
        <Stat value={overall ?? '—'} unit={overall === null ? '' : '%'} label="正答率" goal="目標 80%" ratio={(overall ?? 0) / 80} />
        <Stat value={journalThisWeek} unit="本" label="直近7日の日記" goal="目標 5本" ratio={journalThisWeek / 5} />
        <Stat value={mastered.size} unit={`/ ${terms.length}`} label="覚えた用語" goal={`全 ${terms.length}語`} ratio={mastered.size / terms.length} />
      </div>

      <section className="card mb-3">
        <h2 className="label">今日のタスク</h2>
        <ul className="space-y-2 text-sm">
          {[
            { done: !!todayLog?.quizDone, text: `デイリークイズ${todayLog?.answeredCount ? `（${todayLog.correctCount} / ${todayLog.answeredCount} 問正解）` : ''}` },
            { done: !!todayLog?.journalDone, text: 'マーケット日記' },
          ].map((t) => (
            <li key={t.text} className="flex items-center gap-2.5">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${t.done ? 'bg-good text-surface' : 'bg-raised text-transparent'}`}>✓</span>
              <span className={t.done ? '' : 'text-sub'}>{t.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mb-3">
        <h2 className="label">分野別の正答率</h2>
        <ul className="space-y-4">
          {CATEGORIES.map((c) => {
            const a = byCategory.get(c.id)
            const p = pct(a)
            return (
              <li key={c.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="tabular-nums">{p === null ? <span className="muted">未回答</span> : <>{p}% <span className="muted text-xs">（{a!.correct}/{a!.seen}）</span></>}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-raised">
                  <div className={`h-full rounded-full transition-all duration-700 ${p !== null && p < 80 ? 'bg-warn' : 'bg-good'}`} style={{ width: `${p ?? 0}%` }} />
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
          <ol className="divide-y divide-line">
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
