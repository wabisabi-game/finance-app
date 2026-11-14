import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { recordDrill } from '../lib/db'
import {
  currentAssets, currentLiabilities, diagnose, equity, formatValue, generateCompany, grossProfit, investingCF, isClose,
  netIncome, operatingCF, operatingProfit, pickMetrics, pretaxProfit, totalAssets, totalLiabilities,
  type Company, type Metric, type Statement,
} from '../lib/drill'
import { parseNumber } from '../lib/journal'

const PER_COMPANY = 5
const TABS: Statement[] = ['PL', 'BS', 'CF']
const TAB_LABEL: Record<string, string> = { PL: '損益計算書', BS: '貸借対照表', CF: 'CF計算書' }

const n = (v: number) => v.toLocaleString('ja-JP')

type Row = { label: string; value: number; level?: 'sub' | 'total' | 'grand' }

function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="text-sm">
      {rows.map((r) => (
        <div
          key={r.label}
          className={`flex items-baseline justify-between gap-3 py-1.5 tabular-nums ${r.level === 'sub' ? 'text-sub pl-3' : ''} ${
            r.level === 'total' || r.level === 'grand' ? 'border-line border-t font-bold' : ''
          } ${r.level === 'grand' ? 'text-base' : ''}`}
        >
          <dt>{r.label}</dt>
          <dd>{n(r.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function Statements({ c, tab, setTab }: { c: Company; tab: Statement; setTab: (t: Statement) => void }) {
  return (
    <section className="card mb-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-bold">{c.name}</h2>
        <span className="muted text-xs">単位：億円・実効税率30%</span>
      </div>
      <div className="bg-raised/70 mb-3 grid grid-cols-3 gap-1 rounded-2xl p-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-10 rounded-xl text-sm font-bold transition ${tab === t ? 'bg-surface text-ink shadow-sm' : 'text-sub'}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {tab === 'PL' && (
        <Rows rows={[
          { label: '売上高', value: c.sales },
          { label: '売上原価', value: c.cogs, level: 'sub' },
          { label: '売上総利益', value: grossProfit(c), level: 'total' },
          { label: '販売費及び一般管理費', value: c.sga, level: 'sub' },
          { label: '営業利益', value: operatingProfit(c), level: 'total' },
          { label: '支払利息', value: c.interest, level: 'sub' },
          { label: '税引前当期純利益', value: pretaxProfit(c), level: 'total' },
          { label: '法人税等', value: c.tax, level: 'sub' },
          { label: '当期純利益', value: netIncome(c), level: 'grand' },
        ]} />
      )}
      {tab === 'BS' && (
        <div className="grid gap-x-6 sm:grid-cols-2">
          <div>
            <p className="label mb-0">資産</p>
            <Rows rows={[
              { label: '現金及び預金', value: c.cash, level: 'sub' },
              { label: '売掛金', value: c.receivables, level: 'sub' },
              { label: '棚卸資産', value: c.inventory, level: 'sub' },
              { label: '流動資産', value: currentAssets(c), level: 'total' },
              { label: '有形固定資産', value: c.ppe, level: 'total' },
              { label: '資産合計', value: totalAssets(c), level: 'grand' },
            ]} />
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="label mb-0">負債・純資産</p>
            <Rows rows={[
              { label: '買掛金', value: c.payables, level: 'sub' },
              { label: '短期借入金', value: c.shortDebt, level: 'sub' },
              { label: '流動負債', value: currentLiabilities(c), level: 'total' },
              { label: '長期借入金', value: c.longDebt, level: 'total' },
              { label: '負債合計', value: totalLiabilities(c), level: 'total' },
              { label: '純資産', value: equity(c), level: 'total' },
              { label: '負債・純資産合計', value: totalAssets(c), level: 'grand' },
            ]} />
          </div>
        </div>
      )}
      {tab === 'CF' && (
        <Rows rows={[
          { label: '当期純利益', value: netIncome(c), level: 'sub' },
          { label: '減価償却費', value: c.depreciation, level: 'sub' },
          { label: '運転資本の増減', value: -c.workingCapitalIncrease, level: 'sub' },
          { label: '営業活動によるCF', value: operatingCF(c), level: 'total' },
          { label: '投資活動によるCF（設備投資）', value: investingCF(c), level: 'total' },
          { label: '財務活動によるCF', value: c.financingCF, level: 'total' },
        ]} />
      )}
      <p className="border-line text-sub mt-3 flex justify-between border-t pt-3 text-sm tabular-nums">
        <span>株式時価総額</span>
        <span className="text-ink font-bold">{n(c.marketCap)}</span>
      </p>
    </section>
  )
}

function Question({ c, m, onDone }: { c: Company; m: Metric; onDone: (correct: boolean) => void }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<{ value: number; correct: boolean } | null>(null)
  const [hint, setHint] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const truth = m.value(c)
  const parsed = parseNumber(input)

  useEffect(() => {
    if (result) box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [result])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (parsed === null || result) return
    const correct = isClose(parsed, truth, m.unit)
    setResult({ value: parsed, correct })
    void recordDrill(m.id, correct)
  }

  return (
    <div className="animate-enter">
      <p className="text-xl leading-relaxed font-bold">
        この会社の<span className="text-accent-ink">{m.label}</span>は？
      </p>
      <p className="muted mb-4 text-sm">
        単位：{m.unit}
        {m.unit === '%' || m.unit === '億円' ? '' : '（小数第2位まで）'}・使う表：{m.uses.map((u) => (u === '市場' ? '時価総額' : TAB_LABEL[u])).join('、')}
      </p>

      <form onSubmit={submit} className="flex gap-2">
        <button type="button" disabled={!!result} onClick={() => setInput((s) => (s.startsWith('-') ? s.slice(1) : `-${s}`))} className="btn w-12 shrink-0 px-0 text-lg" aria-label="プラスとマイナスを切り替え">
          ±
        </button>
        <div className="relative flex-1">
          <input className="input pr-14 text-right text-lg font-bold tabular-nums" inputMode="decimal" enterKeyHint="done" autoComplete="off" placeholder="答え" value={input} disabled={!!result} onChange={(e) => setInput(e.target.value)} aria-label={`${m.label}の答え（${m.unit}）`} />
          <span className="text-sub pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold">{m.unit}</span>
        </div>
        <button className="btn-primary shrink-0 px-5" disabled={parsed === null || !!result}>答える</button>
      </form>

      {!result && (
        <button className="text-accent-ink mt-3 min-h-9 text-sm font-bold" onClick={() => setHint((h) => !h)} aria-expanded={hint}>
          {hint ? '公式を隠す' : '公式を見る'}
        </button>
      )}
      {hint && !result && <p className="bg-accent-soft mt-1 rounded-2xl px-4 py-3 text-sm font-medium">{m.label} ＝ {m.formula}</p>}

      {result && (
        <div ref={box} className="animate-enter mt-4 scroll-mb-28">
          <div className={`rounded-3xl p-5 ${result.correct ? 'bg-good-soft' : 'bg-bad-soft'}`}>
            <p className={`font-bold ${result.correct ? 'text-good' : 'text-bad'}`}>
              {result.correct ? '正解' : '不正解'}
              <span className="text-ink ml-2 font-semibold">答え {formatValue(truth, m.unit)}</span>
            </p>
            <p className="mt-2 text-sm font-semibold">{m.label} ＝ {m.formula}</p>
            <p className="text-sub mt-1 text-sm tabular-nums">＝ {m.working(c)} ＝ {formatValue(truth, m.unit)}</p>
            {!result.correct && <p className="text-sub mt-1 text-sm">あなたの答え：{formatValue(result.value, m.unit)}</p>}
            <Link to={`/dictionary/${m.termId}`} className="text-accent-ink mt-2 inline-flex min-h-9 items-center text-sm font-bold">辞書で確認する ›</Link>
          </div>
          <button className="btn-primary mt-4 w-full" onClick={() => onDone(result.correct)}>次へ</button>
        </div>
      )}
    </div>
  )
}

export default function Drill() {
  const [round, setRound] = useState(0)
  const company = useMemo(() => generateCompany(), [round])
  const metrics = useMemo(() => pickMetrics(PER_COMPANY), [round])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [tab, setTab] = useState<Statement>('PL')
  const done = index >= metrics.length

  function next(correct: boolean) {
    setResults((r) => [...r, correct])
    setIndex((i) => i + 1)
  }
  function newCompany() {
    setRound((r) => r + 1)
    setIndex(0)
    setResults([])
    setTab('PL')
    window.scrollTo(0, 0)
  }

  return (
    <>
      <PageHeader title="財務分析ドリル" back="/quiz" />

      {!done && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {metrics.map((m, i) => (
              <span key={m.id} className={`h-1.5 flex-1 rounded-full ${results[i] === true ? 'bg-good' : results[i] === false ? 'bg-bad' : i === index ? 'bg-accent' : 'bg-raised'}`} />
            ))}
          </div>
          <span className="muted text-sm font-semibold tabular-nums">{index + 1} / {metrics.length}</span>
        </div>
      )}

      <Statements c={company} tab={tab} setTab={setTab} />

      {!done ? (
        <Question key={`${round}-${index}`} c={company} m={metrics[index]} onDone={next} />
      ) : (
        <section className="animate-pop">
          <div className="card mb-4 text-center">
            <p className="muted text-sm">結果</p>
            <p className="text-4xl font-bold tabular-nums">{results.filter(Boolean).length}<span className="muted text-lg"> / {results.length}</span></p>
          </div>
          <div className="card mb-4">
            <h2 className="label">この会社をどう読むか（目安）</h2>
            <ul className="divide-line divide-y">
              {diagnose(company).map((d) => (
                <li key={d.label} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold">{d.label}</span>
                    <span className={`shrink-0 font-bold tabular-nums ${d.tone === 'good' ? 'text-good' : d.tone === 'bad' ? 'text-bad' : ''}`}>{d.value}</span>
                  </div>
                  <p className="muted mt-0.5 text-sm">{d.note}</p>
                </li>
              ))}
            </ul>
            <p className="muted mt-2 text-xs">基準は一般的な目安で、業種によって適正な水準は大きく違います。面接では「同業他社と比べて」「過去と比べて」の視点を添えましょう。</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button className="btn-primary" onClick={newCompany}>別の会社で続ける</button>
            <Link to="/quiz" className="btn">戻る</Link>
          </div>
        </section>
      )}
    </>
  )
}
