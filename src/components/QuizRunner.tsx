import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { termById } from '../lib/content'
import { shuffle } from '../lib/srs'
import type { Question } from '../types'

const TYPE_LABEL = { choice: '4択', truefalse: '○×', causal: '因果問題' } as const

interface Props {
  questions: Question[]
  /** 再開時にすでに回答済みの結果（questionId → 正解したか） */
  initialAnswers?: Record<string, boolean>
  onAnswer: (q: Question, correct: boolean) => Promise<void> | void
  doneActions?: React.ReactNode
}

export default function QuizRunner({ questions, initialAnswers = {}, onAnswer, doneActions }: Props) {
  const [results, setResults] = useState<Record<string, boolean>>(initialAnswers)
  const [index, setIndex] = useState(() => {
    const i = questions.findIndex((q) => !(q.id in initialAnswers))
    return i === -1 ? questions.length : i
  })
  const [picked, setPicked] = useState<number | null>(null)

  const q = questions[index] as Question | undefined
  // 選択肢の並びは問題ごとに固定してシャッフルする（○×は並べ替えない）
  const order = useMemo(() => {
    if (!q) return []
    const idx = q.choices.map((_, i) => i)
    return q.type === 'truefalse' ? idx : shuffle(idx)
  }, [q])

  const answered = Object.keys(results).length
  const correctCount = Object.values(results).filter(Boolean).length

  if (!q) {
    return (
      <div className="card text-center">
        <p className="muted text-sm">結果</p>
        <p className="my-2 text-4xl font-bold">
          {correctCount}
          <span className="muted text-xl"> / {questions.length}</span>
        </p>
        <p className="muted mb-4 text-sm">
          正答率 {questions.length ? Math.round((correctCount / questions.length) * 100) : 0}%
        </p>
        <div className="flex flex-col gap-2">{doneActions}</div>
      </div>
    )
  }

  const term = termById.get(q.termId)
  const isCorrect = picked === q.answerIndex

  function pick(i: number) {
    if (picked !== null || !q) return
    setPicked(i)
    const correct = i === q.answerIndex
    setResults((r) => ({ ...r, [q.id]: correct }))
    void onAnswer(q, correct)
  }

  function next() {
    setPicked(null)
    setIndex((i) => i + 1)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={answered} aria-valuemax={questions.length}>
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
        <span className="muted text-sm tabular-nums">
          {Math.min(index + 1, questions.length)} / {questions.length}
        </span>
      </div>

      <div className="card mb-3">
        <span className="chip mb-3 min-h-7 text-xs">{TYPE_LABEL[q.type]}</span>
        <p className="text-lg leading-relaxed font-medium">{q.prompt}</p>
      </div>

      <div className={q.type === 'truefalse' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
        {order.map((i) => {
          let style = 'border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
          if (picked !== null) {
            if (i === q.answerIndex) style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
            else if (i === picked) style = 'border-rose-500 bg-rose-50 dark:bg-rose-950'
            else style = 'border-slate-200 opacity-50 dark:border-slate-800'
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`min-h-14 rounded-xl border px-4 py-3 text-left leading-snug transition-colors ${style} ${
                q.type === 'truefalse' ? 'text-center text-2xl' : ''
              }`}
            >
              {q.choices[i]}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div className="mt-4">
          <div className={`card ${isCorrect ? 'border-emerald-500/60' : 'border-rose-500/60'}`}>
            <p className={`mb-1 font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isCorrect ? '正解' : '不正解'}
            </p>
            <p className="leading-relaxed">{q.explanation}</p>
            {term && (
              <Link to={`/dictionary/${term.id}`} className="mt-3 inline-block text-sm font-medium text-emerald-600 underline underline-offset-4 dark:text-emerald-400">
                辞書で「{term.nameJa}」を見る
              </Link>
            )}
          </div>
          <button onClick={next} className="btn-primary sticky bottom-24 mt-3 w-full md:static">
            {index + 1 < questions.length ? '次の問題へ' : '結果を見る'}
          </button>
        </div>
      )}
    </div>
  )
}
