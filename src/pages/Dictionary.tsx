import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { CATEGORIES, categoryColor, categoryLabel, searchTerms, terms } from '../lib/content'
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
          <button key={c.id} className={`chip ${category === c.id ? 'chip-on' : ''}`} onClick={() => setCategory(c.id)}>
            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {([['all', 'すべて'], ['learning', '未習得'], ['mastered', '覚えた']] as const).map(([id, label]) => (
          <button key={id} className={`chip ${status === id ? 'chip-on' : ''}`} onClick={() => setStatus(id)}>{label}</button>
        ))}
      </div>

      <p className="muted mb-2 text-sm">{list.length}語</p>
      <ul className="flex flex-col gap-3">
        {list.map((t) => (
          <li key={t.id}>
            <Link to={`/dictionary/${t.id}`} className="card block">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="muted mb-1 flex items-center gap-1.5 text-xs font-semibold">
                    <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(t.category) }} />
                    {categoryLabel(t.category)}
                  </p>
                  <p className="text-lg leading-snug font-bold">{t.nameJa}</p>
                  <p className="muted truncate text-xs">{t.nameEn}</p>
                </div>
                {mastered?.has(t.id) && <span className="bg-good-soft text-good shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold">✓ 覚えた</span>}
              </div>
              <p className="mt-2 text-sm">{t.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="card muted">該当する用語がありません。</p>}
    </>
  )
}
