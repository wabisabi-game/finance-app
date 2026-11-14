import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import QuizRunner from '../components/QuizRunner'
import { CATEGORIES, categoryLabel, questions, questionsForCategory, questionsForTerm, termById } from '../lib/content'
import { recordAnswer } from '../lib/quiz'
import { shuffle } from '../lib/srs'
import type { Category } from '../types'

const PRACTICE_SIZE = 10

export default function Practice() {
  const [params] = useSearchParams()
  const termId = params.get('term')
  const categoryParam = params.get('category')
  const category = CATEGORIES.some((c) => c.id === categoryParam) ? (categoryParam as Category) : null
  const term = termId ? termById.get(termId) : undefined
  const [round, setRound] = useState(0)

  const list = useMemo(() => {
    if (term) return shuffle(questionsForTerm(term.id))
    return shuffle(category ? questionsForCategory(category) : questions).slice(0, PRACTICE_SIZE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, category, round])

  const title = term ? `演習：${term.nameJa}` : category ? `演習：${categoryLabel(category)}` : '演習：ランダム'

  return (
    <>
      <PageHeader title={title} back={term ? `/dictionary/${term.id}` : '/quiz'} />
      {list.length === 0 ? (
        <p className="card muted">この条件の問題はまだありません。</p>
      ) : (
        <QuizRunner
          key={round}
          questions={list}
          onAnswer={(q, correct) => recordAnswer(q, correct)}
          doneActions={
            <>
              <button className="btn-primary" onClick={() => setRound((r) => r + 1)}>もう一度</button>
              <Link to={term ? `/dictionary/${term.id}` : '/quiz'} className="btn">戻る</Link>
            </>
          }
        />
      )}
    </>
  )
}
