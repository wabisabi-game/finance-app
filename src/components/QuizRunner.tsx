import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryColor, categoryLabel, termById } from '../lib/content'
import { shuffle } from '../lib/srs'
import type { Question } from '../types'
import Ring from './Ring'

const TYPE_LABEL = { choice: '4択', truefalse: '○×', causal: '因果問題' } as const
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

interface Props {
  questions: Question[]
  /** 再開時にすでに回答済みの結果（questionId → 正解したか） */
  initialAnswers?: Record<string, boolean>
  onAnswer: (q: Question, correct: boolean) => Promise<void> | void
  doneActions?: React.ReactNode
}

const Check = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)
const Cross = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
)

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

  // 回答したら、解説と「次へ」ボタンが見える位置まで送る
  const feedback = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (picked !== null) feedback.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [picked])

  const correctCount = Object.values(results).filter(Boolean).length

  if (!q) {
    const rate = questions.length ? correctCount / questions.length : 0
    return (
      <div className="card animate-pop flex flex-col items-center py-8 text-center">
        <Ring value={rate} size={148} stroke={12} tone={rate >= 0.8 ? 'good' : 'accent'}>
          <span className="text-4xl leading-none font-bold tabular-nums">{correctCount}<span className="muted text-lg font-semibold"> / {questions.length}</span></span>
          <span className="muted mt-2 text-xs leading-none font-semibold">正答率 {Math.round(rate * 100)}%</span>
        </Ring>
        <p className="mt-5 text-lg font-bold">{rate === 1 ? '全問正解です' : rate >= 0.8 ? '目標の80%を達成' : 'おつかれさまでした'}</p>
        <div className="mt-5 flex w-full flex-col gap-2.5">{doneActions}</div>
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
      {/* 1問ごとの区切りで、正誤の履歴も見える進捗バー */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuenow={Object.keys(results).length} aria-valuemax={questions.length} aria-label="進み具合">
          {questions.map((item, i) => {
            const r = results[item.id]
            const tone = r === true ? 'bg-good' : r === false ? 'bg-bad' : i === index ? 'bg-accent' : 'bg-raised'
            return <span key={item.id} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${tone}`} />
          })}
        </div>
        <span className="muted text-sm font-semibold tabular-nums">{index + 1} / {questions.length}</span>
      </div>

      <div key={q.id} className="animate-enter">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
          {term && (
            <span className="text-sub flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(term.category) }} />
              {categoryLabel(term.category)}
            </span>
          )}
          <span className="bg-raised text-sub rounded-full px-2.5 py-0.5">{TYPE_LABEL[q.type]}</span>
        </div>
        <p className="mb-6 text-xl leading-relaxed font-bold">{q.prompt}</p>

        <div className={q.type === 'truefalse' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-2.5'}>
          {order.map((i, pos) => {
            const isAnswer = i === q.answerIndex
            let box = 'bg-surface border-line hover:border-accent'
            let badge = 'bg-raised text-sub'
            if (picked !== null) {
              if (isAnswer) { box = 'bg-good-soft border-good'; badge = 'bg-good text-surface' }
              else if (i === picked) { box = 'bg-bad-soft border-bad'; badge = 'bg-bad text-surface' }
              else box = 'bg-surface border-line opacity-45'
            }
            const mark = picked !== null && isAnswer ? <Check /> : picked !== null && i === picked ? <Cross /> : null
            return q.type === 'truefalse' ? (
              <button key={i} onClick={() => pick(i)} disabled={picked !== null} aria-label={i === 0 ? 'マル' : 'バツ'} className={`flex min-h-24 items-center justify-center rounded-3xl border-2 text-4xl font-bold transition duration-150 active:scale-[0.97] ${box}`}>
                {q.choices[i]}
              </button>
            ) : (
              <button key={i} onClick={() => pick(i)} disabled={picked !== null} className={`flex min-h-16 items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left leading-snug transition duration-150 active:scale-[0.985] ${box}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${badge}`}>{mark ?? LETTERS[pos]}</span>
                <span className="flex-1">{q.choices[i]}</span>
              </button>
            )
          })}
        </div>

        {picked !== null && (
          <div ref={feedback} className="animate-enter mt-5 scroll-mb-28">
            <div className={`rounded-3xl p-5 ${isCorrect ? 'bg-good-soft' : 'bg-bad-soft'}`}>
              <p className={`mb-1.5 flex items-center gap-2 font-bold ${isCorrect ? 'text-good' : 'text-bad'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-surface ${isCorrect ? 'bg-good' : 'bg-bad'}`}>{isCorrect ? <Check /> : <Cross />}</span>
                {isCorrect ? '正解' : '不正解'}
              </p>
              <p>{q.explanation}</p>
              {term && (
                <Link to={`/dictionary/${term.id}`} className="text-accent-ink mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-bold">
                  辞書で「{term.nameJa}」を見る <span aria-hidden="true">›</span>
                </Link>
              )}
            </div>
            <button onClick={next} className="btn-primary mt-4 w-full">
              {index + 1 < questions.length ? '次の問題へ' : '結果を見る'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
