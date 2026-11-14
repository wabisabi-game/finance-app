import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { CATEGORIES, categoryLabel, searchTerms, terms } from '../lib/content'
import { getMastered } from '../lib/db'
import { useData } from '../lib/useData'
import type { Category } from '../types'

type Status = 'all' | 'mastered' | 'learning'

export default function Dictionary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [status, setStatus] = useState<Status>('all')
  const [mastered] = useData(getMastered)

  const list = searchTerms(query, category).filter((t) => {
    if (status === 'all' || !mastered) return true
    return mastered.has(t.id) === (status === 'mastered')
  })

  return (
    <>
      <PageHeader title="用語辞書" right={<span className="muted text-sm">覚えた {mastered?.size ?? 0} / {terms.length}</span>} />
      <input className="input mb-3" type="search" placeholder="用語を検索（日本語・英語）" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={`chip ${category === 'all' ? 'chip-on' : ''}`} onClick={() => setCategory('all')}>すべて</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip ${category === c.id ? 'chip-on' : ''}`} onClick={() => setCategory(c.id)}>{c.label}</button>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {([['all', 'すべて'], ['learning', '未習得'], ['mastered', '覚えた']] as const).map(([id, label]) => (
          <button key={id} className={`chip ${status === id ? 'chip-on' : ''}`} onClick={() => setStatus(id)}>{label}</button>
        ))}
      </div>

      <p className="muted mb-2 text-sm">{list.length}語</p>
      <ul className="flex flex-col gap-2">
        {list.map((t) => (
          <li key={t.id}>
            <Link to={`/dictionary/${t.id}`} className="card block hover:border-emerald-500">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold">{t.nameJa}</p>
                  <p className="muted truncate text-xs">{t.nameEn}・{categoryLabel(t.category)}</p>
                </div>
                {mastered?.has(t.id) && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">覚えた</span>}
              </div>
              <p className="mt-1.5 text-sm">{t.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="card muted">該当する用語がありません。</p>}
    </>
  )
}
