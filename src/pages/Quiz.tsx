import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import QuizRunner from '../components/QuizRunner'
import { CATEGORIES, questionById, questionsForCategory } from '../lib/content'
import { loadDailySession, recordAnswer } from '../lib/quiz'
import { loadSettings } from '../lib/settings'
import { useData } from '../lib/useData'
import type { Question } from '../types'

export default function Quiz() {
  const [session] = useData(() => loadDailySession(loadSettings().dailyCount))
  if (!session) return <PageHeader title="デイリークイズ" />

  const list = session.questionIds.map((id) => questionById.get(id)).filter((q): q is Question => !!q)

  return (
    <>
      <PageHeader title="デイリークイズ" />
      {list.length === 0 ? (
        <p className="card muted">出題できる問題がありません。</p>
      ) : (
        <QuizRunner
          questions={list}
          initialAnswers={session.answers}
          onAnswer={(q, correct) => recordAnswer(q, correct, session)}
          doneActions={
            <>
              <p className="mb-2 text-sm">今日のクイズは完了です。</p>
              <Link to="/journal" className="btn-primary">日記を書く</Link>
              <Link to="/" className="btn">ホームへ</Link>
            </>
          }
        />
      )}

      <Link to="/quiz/drill" className="card mt-10 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: '#16a3b4' }} aria-hidden="true">÷</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">財務分析ドリル</span>
          <span className="muted block text-sm">架空の会社の財務三表から、ROICやROEを計算する</span>
        </span>
        <span className="text-accent-ink shrink-0 text-xl" aria-hidden="true">›</span>
      </Link>

      <section className="border-line mt-8 border-t pt-7">
        <h2 className="text-lg font-bold">自主演習</h2>
        <p className="muted mb-4 text-sm">好きな分野を何度でも解けます。正解しても復習の間隔は延びません。</p>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/quiz/practice" className="btn">ランダム10問</Link>
          <Link to="/quiz/practice?mode=cases" className="btn">事例から当てる</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/quiz/practice?category=${c.id}`} className="btn h-auto flex-col items-start gap-0.5 py-3 text-left">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                {c.label}
              </span>
              <span className="muted pl-3.5 text-xs font-medium">{questionsForCategory(c.id).length}問</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
