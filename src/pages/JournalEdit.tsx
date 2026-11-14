import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import TwoMinuteTimer from '../components/TwoMinuteTimer'
import { formatDateJa, isDateStr, todayStr } from '../lib/date'
import { deleteEntry, getEntry, putEntry, updateLog } from '../lib/db'
import { emptyEntry, hasContent, parseNumber, parseTags, PRICE_FIELDS } from '../lib/journal'
import { PRICE_KEYS, type JournalEntry, type PriceKey } from '../types'

interface Form {
  prices: Record<PriceKey, { close: string; change: string }>
  news: string[]
  explanation: string
  confidence: number
  review: string
  tags: string
}

const numStr = (n: number | null) => (n === null ? '' : String(n))

function toForm(e: JournalEntry): Form {
  return {
    prices: Object.fromEntries(
      PRICE_KEYS.map((k) => [k, { close: numStr(e.prices[k].close), change: numStr(e.prices[k].change) }]),
    ) as Form['prices'],
    news: [0, 1, 2].map((i) => e.news[i] ?? ''),
    explanation: e.explanation,
    confidence: e.confidence,
    review: e.review,
    tags: e.tags.join(' '),
  }
}

function toEntry(date: string, f: Form): JournalEntry {
  return {
    date,
    prices: Object.fromEntries(
      PRICE_KEYS.map((k) => [k, { close: parseNumber(f.prices[k].close), change: parseNumber(f.prices[k].change) }]),
    ) as JournalEntry['prices'],
    news: f.news.map((n) => n.trim()).filter(Boolean),
    explanation: f.explanation,
    confidence: f.confidence,
    review: f.review,
    tags: parseTags(f.tags),
    updatedAt: new Date().toISOString(),
  }
}

const isBadNumber = (s: string) => s.trim() !== '' && parseNumber(s) === null

export default function JournalEdit() {
  const { date = '' } = useParams()
  const valid = isDateStr(date)
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>()
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saved'>('idle')
  const [timerOpen, setTimerOpen] = useState(false)
  const latest = useRef<Form | undefined>(undefined)
  const dirty = useRef(false)

  useEffect(() => {
    if (!valid) return
    let alive = true
    latest.current = undefined
    dirty.current = false
    setForm(undefined)
    setStatus('idle')
    void getEntry(date).then((e) => alive && setForm(toForm(e ?? emptyEntry(date))))
    return () => {
      alive = false
    }
  }, [date, valid])

  async function save() {
    if (!dirty.current || !latest.current) return
    dirty.current = false
    const entry = toEntry(date, latest.current)
    if (hasContent(entry)) await putEntry(entry)
    else await deleteEntry(date)
    await updateLog(date, { journalDone: !!entry.explanation.trim() })
    if (!dirty.current) setStatus('saved')
  }

  // 入力が止まって少ししたら自動保存する。画面を離れるときも保存する
  useEffect(() => {
    if (status !== 'dirty') return
    const id = setTimeout(() => void save(), 600)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, status])
  useEffect(() => {
    const flush = () => void save()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  if (!valid) return <Navigate to="/journal" replace />
  if (!form) return <PageHeader title={formatDateJa(date)} back="/journal" />

  function update(patch: Partial<Form>) {
    const next = { ...form!, ...patch }
    latest.current = next
    dirty.current = true
    setForm(next)
    setStatus('dirty')
  }

  const isPast = date < todayStr()

  return (
    <>
      <PageHeader
        title={formatDateJa(date)}
        back="/journal"
        right={<span className="muted text-xs" role="status">{status === 'dirty' ? '保存中…' : status === 'saved' ? '保存済み' : ''}</span>}
      />

      <section className="card mb-3">
        <h2 className="label">終値と前日比</h2>
        <div className="grid grid-cols-[1fr_6.5rem_5.5rem] items-center gap-x-2 gap-y-2 sm:grid-cols-[1fr_9rem_8rem]">
          <span />
          <span className="muted text-center text-xs">終値</span>
          <span className="muted text-center text-xs">前日比</span>
          {PRICE_FIELDS.map((f) => (
            <div key={f.key} className="contents">
              <label htmlFor={`close-${f.key}`} className="text-sm">
                {f.label}
                {f.unit && <span className="muted text-xs">（{f.unit}）</span>}
              </label>
              {(['close', 'change'] as const).map((field) => {
                const value = form.prices[f.key][field]
                return (
                  <input
                    key={field}
                    id={`${field}-${f.key}`}
                    aria-label={`${f.label} ${field === 'close' ? '終値' : '前日比'}`}
                    aria-invalid={isBadNumber(value)}
                    className={`input px-2.5 text-right tabular-nums ${isBadNumber(value) ? 'border-bad!' : ''}`}
                    inputMode="text"
                    placeholder={field === 'close' ? '—' : '±'}
                    value={value}
                    onChange={(e) => update({ prices: { ...form.prices, [f.key]: { ...form.prices[f.key], [field]: e.target.value } } })}
                  />
                )
              })}
            </div>
          ))}
        </div>
        {PRICE_KEYS.some((k) => isBadNumber(form.prices[k].close) || isBadNumber(form.prices[k].change)) && (
          <p className="mt-2 text-xs text-bad">赤枠の欄は数値として読めないため保存されません（例：38500.25、-120、+0.05）。</p>
        )}
      </section>

      <section className="card mb-3">
        <h2 className="label">主なニュース（1〜3件）</h2>
        <div className="flex flex-col gap-2">
          {form.news.map((n, i) => (
            <input key={i} className="input" aria-label={`ニュース${i + 1}`} placeholder={`ニュース ${i + 1}`} value={n} onChange={(e) => update({ news: form.news.map((v, j) => (j === i ? e.target.value : v)) })} />
          ))}
        </div>
      </section>

      <section className="card mb-3">
        <label htmlFor="explanation" className="label">なぜ動いたか（自分の説明）</label>
        <textarea id="explanation" className="input min-h-40 leading-relaxed" placeholder="例：米CPIが予想を上回り利下げ観測が後退 → 米10年債利回りが上昇 → 日米金利差の拡大でドル円は円安に…" value={form.explanation} onChange={(e) => update({ explanation: e.target.value })} />
        <div className="mt-3">
          <span className="label" id="confidence-label">確信度</span>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="confidence-label">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={form.confidence === n} className={`min-h-12 rounded-2xl text-base font-bold transition active:scale-95 ${form.confidence === n ? 'bg-accent text-white' : 'bg-raised/60 text-sub'}`} onClick={() => update({ confidence: n })}>
                {n}
              </button>
            ))}
          </div>
          <p className="muted mt-1 flex justify-between text-xs"><span>自信なし</span><span>自信あり</span></p>
        </div>
      </section>

      <button className="bg-accent-soft text-accent-ink mb-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl text-sm font-bold transition active:scale-[0.98]" onClick={() => setTimerOpen(true)}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
        2分説明モードで練習する
      </button>

      <section className={`card mb-3 ${isPast && !form.review.trim() ? 'border-warn!' : ''}`}>
        <label htmlFor="review" className="label">答え合わせ（翌日以降に追記）</label>
        <textarea id="review" className="input min-h-28 leading-relaxed" placeholder="報道や解説と比べてどうだったか。合っていた点、見落としていた要因、次に活かすこと。" value={form.review} onChange={(e) => update({ review: e.target.value })} />
      </section>

      <section className="card mb-6">
        <label htmlFor="tags" className="label">タグ（スペース区切り）</label>
        <input id="tags" className="input" placeholder="例：CPI 円安 FOMC" value={form.tags} onChange={(e) => update({ tags: e.target.value })} />
      </section>

      <button
        className="text-bad flex min-h-12 w-full items-center justify-center text-sm font-semibold"
        onClick={async () => {
          if (!confirm(`${formatDateJa(date)} の日記を削除しますか？`)) return
          dirty.current = false
          await deleteEntry(date)
          await updateLog(date, { journalDone: false })
          navigate('/journal')
        }}
      >
        この日記を削除
      </button>

      {timerOpen && <TwoMinuteTimer entry={toEntry(date, form)} onClose={() => setTimerOpen(false)} />}
    </>
  )
}
