import { Link } from 'react-router-dom'
import { formatDateJa, todayStr } from '../lib/date'
import { getJournal, getLogs } from '../lib/db'
import { loadDailySession } from '../lib/quiz'
import { loadSettings } from '../lib/settings'
import { computeStreak } from '../lib/stats'
import { useData } from '../lib/useData'

function Task({ to, title, detail, done, cta }: { to: string; title: string; detail: string; done: boolean; cta: string }) {
  return (
    <Link to={to} className={`card flex items-center gap-3 hover:border-emerald-500 ${done ? 'opacity-70' : ''}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`} aria-hidden="true">
        {done ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="muted block text-sm">{detail}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{done ? '完了' : cta} ›</span>
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
  // 答え合わせがまだの、いちばん新しい過去の日記
  const toReview = journal
    .filter((e) => e.date < today && e.explanation.trim() && !e.review.trim())
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      <header className="mb-5 flex items-start justify-between">
        <div>
          <p className="muted text-sm">{formatDateJa(today)}</p>
          <h1 className="text-2xl font-bold">今日のタスク</h1>
        </div>
        <Link to="/settings" className="btn md:hidden">設定</Link>
      </header>

      <div className="card mb-4 flex items-center gap-4">
        <span className="text-4xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">{streak}</span>
        <span>
          <span className="block font-bold">日連続で学習中</span>
          <span className="muted block text-sm">
            {quizDone || journalDone ? '今日の分は記録済みです。' : streak > 0 ? '今日クイズか日記を終えると記録が伸びます。' : 'クイズか日記を終えると1日目になります。'}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Task to="/quiz" title="デイリークイズ" detail={total === 0 ? '出題できる問題がありません' : `${answered} / ${total} 問`} done={quizDone} cta={answered > 0 ? '続きから' : '始める'} />
        <Task to={`/journal/${today}`} title="マーケット日記" detail={journalDone ? '今日の説明を書きました' : 'なぜ動いたかを自分の言葉で'} done={journalDone} cta={todayEntry ? '続きを書く' : '書く'} />
      </div>

      {toReview && (
        <Link to={`/journal/${toReview.date}`} className="card mt-4 block border-amber-500/70 hover:border-amber-500">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">答え合わせ ›</p>
          <p className="mt-1 text-sm">{formatDateJa(toReview.date)} の日記を、報道や解説と比べて振り返りましょう。</p>
          <p className="muted mt-1 line-clamp-2 text-sm">{toReview.explanation}</p>
        </Link>
      )}
    </>
  )
}
