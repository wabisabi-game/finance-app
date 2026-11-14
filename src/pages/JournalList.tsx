import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import PriceSummary from '../components/PriceSummary'
import { formatDateJa, todayStr } from '../lib/date'
import { getJournal } from '../lib/db'
import { matchesQuery } from '../lib/journal'
import { useData } from '../lib/useData'

export default function JournalList() {
  const [entries] = useData(getJournal)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const navigate = useNavigate()
  const today = todayStr()

  const all = [...(entries ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const tags = [...new Set(all.flatMap((e) => e.tags))].sort()
  const list = all.filter((e) => matchesQuery(e, query) && (!tag || e.tags.includes(tag)))
  const hasToday = all.some((e) => e.date === today)

  return (
    <>
      <PageHeader title="マーケット日記" />
      <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
        <Link to={`/journal/${today}`} className="btn-primary">{hasToday ? '今日の日記を開く' : '今日の日記を書く'}</Link>
        <label className="btn relative cursor-pointer">
          日付を選ぶ
          <input type="date" max={today} className="absolute inset-0 cursor-pointer opacity-0" aria-label="日付を選んで日記を開く" onChange={(e) => e.target.value && navigate(`/journal/${e.target.value}`)} />
        </label>
      </div>

      <input className="input mb-3" type="search" placeholder="日記を検索" value={query} onChange={(e) => setQuery(e.target.value)} />
      {tags.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button className={`chip ${tag === null ? 'chip-on' : ''}`} onClick={() => setTag(null)}>すべて</button>
          {tags.map((t) => (
            <button key={t} className={`chip ${tag === t ? 'chip-on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>#{t}</button>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {list.map((e) => (
          <li key={e.date}>
            <Link to={`/journal/${e.date}`} className="card block">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="font-bold">{formatDateJa(e.date)} <span className="muted text-xs font-normal">{e.date.slice(0, 4)}</span></p>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {e.date < today && !e.review.trim() && <span className="bg-warn-soft text-warn rounded-full px-2.5 py-0.5 font-bold">答え合わせ前</span>}
                  <span className="muted">確信度 {e.confidence}</span>
                </div>
              </div>
              <PriceSummary prices={e.prices} />
              {e.explanation && <p className="mt-2 line-clamp-2 text-sm">{e.explanation}</p>}
              {e.tags.length > 0 && <p className="muted mt-1.5 text-xs">{e.tags.map((t) => `#${t}`).join(' ')}</p>}
            </Link>
          </li>
        ))}
      </ul>
      {entries && list.length === 0 && (
        <p className="card muted">{all.length === 0 ? 'まだ日記がありません。今日のマーケットを自分の言葉で説明してみましょう。' : '該当する日記がありません。'}</p>
      )}
    </>
  )
}
