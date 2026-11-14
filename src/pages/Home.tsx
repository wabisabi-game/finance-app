import { Link } from 'react-router-dom'
import { Icon } from '../components/Layout'
import Ring from '../components/Ring'
import { addDays, formatDateJa, parseDate, todayStr } from '../lib/date'
import { getJournal, getLogs } from '../lib/db'
import { loadDailySession } from '../lib/quiz'
import { loadSettings } from '../lib/settings'
import { computeStreak } from '../lib/stats'
import { useData } from '../lib/useData'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function greeting(): string {
  const h = new Date().getHours()
  return h < 4 ? 'おつかれさまです' : h < 11 ? 'おはようございます' : h < 18 ? 'こんにちは' : 'こんばんは'
}

function Task({ to, icon, title, detail, done, cta }: { to: string; icon: string; title: string; detail: string; done: boolean; cta: string }) {
  return (
    <Link to={to} className="card flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${done ? 'bg-good-soft text-good' : 'bg-accent-soft text-accent-ink'}`}>
        {done ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        ) : (
          <Icon name={icon} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-bold">{title}</span>
        <span className="muted block text-sm">{detail}</span>
      </span>
      {done ? (
        <span className="text-good shrink-0 text-sm font-bold">完了</span>
      ) : (
        <span className="bg-accent shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white">{cta}</span>
      )}
    </Link>
  )
}

export default function Home() {
  const today = todayStr()
  const [data] = useData(async () => {
    const [session, logs, journal] = await Promise.all([loadDailySession(loadSettings().dailyCount), getLogs(), getJournal()])
    return { session, logs, journal }
  })
  if (!data) return null

  const { session, logs, journal } = data
  const total = session.questionIds.length
  const answered = session.questionIds.filter((id) => id in session.answers).length
  const quizDone = total > 0 && answered === total
  const todayEntry = journal.find((e) => e.date === today)
  const journalDone = !!todayEntry?.explanation.trim()
  const streak = computeStreak(logs, today)
  const progress = ((total ? answered / total : 0) + (journalDone ? 1 : 0)) / 2
  const doneCount = Number(quizDone) + Number(journalDone)
  const active = new Set(logs.filter((l) => l.quizDone || l.journalDone).map((l) => l.date))
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  // 答え合わせがまだの、いちばん新しい過去の日記
  const toReview = journal
    .filter((e) => e.date < today && e.explanation.trim() && !e.review.trim())
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="muted text-sm font-medium">{formatDateJa(today)}</p>
          <h1 className="text-2xl leading-tight font-bold">{greeting()}</h1>
        </div>
        <Link to="/settings" className="text-sub hover:bg-raised -mr-2 flex h-11 w-11 items-center justify-center rounded-full md:hidden" aria-label="設定">
          <Icon name="settings" />
        </Link>
      </header>

      <section className="card mb-4">
        <div className="flex items-center gap-5">
          <Ring value={progress} tone={doneCount === 2 ? 'good' : 'accent'}>
            <span className="text-2xl leading-none font-bold tabular-nums">{doneCount}<span className="muted text-sm font-semibold">/2</span></span>
            <span className="muted mt-1 text-[10px] leading-none font-semibold">今日</span>
          </Ring>
          <div className="min-w-0">
            <p className="leading-none">
              <span className="text-5xl font-bold tracking-tight tabular-nums">{streak}</span>
              <span className="ml-1.5 text-base font-bold">日連続</span>
            </p>
            <p className="muted mt-2 text-sm">
              {doneCount === 2 ? '今日のタスクはすべて完了です。' : quizDone || journalDone ? '今日の分は記録済み。あと1つです。' : streak > 0 ? '今日どちらかを終えると記録が伸びます。' : 'クイズか日記を終えると1日目になります。'}
            </p>
          </div>
        </div>
        <ol className="border-line mt-5 grid grid-cols-7 border-t pt-4" aria-label="直近7日間の学習">
          {week.map((d) => {
            const on = active.has(d)
            return (
              <li key={d} className="flex flex-col items-center gap-1.5" aria-label={`${formatDateJa(d)} ${on ? '学習済み' : '未学習'}`}>
                <span className={`text-[11px] leading-none font-semibold ${d === today ? 'text-ink' : 'text-sub'}`}>{WEEKDAYS[parseDate(d).getDay()]}</span>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${on ? 'bg-accent text-white' : d === today ? 'border-accent border-2 border-dashed' : 'bg-raised'}`}>
                  {on && <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <h2 className="label mt-7">今日のタスク</h2>
      <div className="flex flex-col gap-3">
        <Task to="/quiz" icon="quiz" title="デイリークイズ" detail={total === 0 ? '出題できる問題がありません' : `${answered} / ${total} 問`} done={quizDone} cta={answered > 0 ? '続きから' : '始める'} />
        <Task to={`/journal/${today}`} icon="journal" title="マーケット日記" detail={journalDone ? '今日の説明を書きました' : 'なぜ動いたかを自分の言葉で'} done={journalDone} cta={todayEntry ? '続きを書く' : '書く'} />
      </div>

      {toReview && (
        <>
          <h2 className="label mt-7">答え合わせ</h2>
          <Link to={`/journal/${toReview.date}`} className="card bg-warn-soft block">
            <p className="text-warn text-sm font-bold">{formatDateJa(toReview.date)} の日記を振り返る</p>
            <p className="mt-1 line-clamp-2 text-sm">{toReview.explanation}</p>
          </Link>
        </>
      )}
    </>
  )
}
