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

      <section className="mt-8">
        <h2 className="mb-2 font-bold">自主演習</h2>
        <p className="muted mb-3 text-sm">好きな分野を何度でも解けます。正解しても復習の間隔は延びません。</p>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/quiz/practice" className="btn col-span-2">ランダム10問</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/quiz/practice?category=${c.id}`} className="btn h-auto flex-col py-2 text-center">
              {c.label}
              <span className="muted text-xs font-normal">{questionsForCategory(c.id).length}問</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
