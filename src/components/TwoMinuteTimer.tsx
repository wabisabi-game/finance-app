import { useEffect, useRef, useState } from 'react'
import type { JournalEntry } from '../types'
import PriceSummary from './PriceSummary'

const TOTAL = 120

/** 「2分説明」モード：今日のマーケットを2分で声に出して要約する練習 */
export default function TwoMinuteTimer({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const [left, setLeft] = useState(TOTAL)
  const [running, setRunning] = useState(false)
  const endAt = useRef(0)

  useEffect(() => {
    if (!running) return
    // 画面が裏に回っても狂わないよう、終了時刻との差で残りを出す
    endAt.current = Date.now() + left * 1000
    const id = setInterval(() => {
      const remain = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setLeft(remain)
      if (remain === 0) {
        setRunning(false)
        navigator.vibrate?.([200, 100, 200])
      }
    }, 200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  const news = entry.news.filter(Boolean)

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-slate-50 dark:bg-slate-950" role="dialog" aria-label="2分説明モード">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">2分説明</h2>
          <button className="btn" onClick={onClose}>閉じる</button>
        </div>
        <p className="muted mt-1 text-sm">「今日のマーケットを2分で説明してください」結論 → 値動き → 理由 → 見通しの順で、声に出して話します。</p>

        <div className={`my-6 text-center text-7xl font-bold tabular-nums ${left === 0 ? 'text-rose-500' : left <= 20 ? 'text-amber-500' : ''}`} aria-live="off">
          {mm}:{ss}
        </div>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(left / TOTAL) * 100}%` }} />
        </div>
        {left === 0 && <p className="mb-2 text-center font-bold text-rose-500" role="status">時間です</p>}

        <div className="my-4 grid grid-cols-2 gap-2">
          <button className="btn-primary" disabled={left === 0} onClick={() => setRunning((r) => !r)}>
            {running ? '一時停止' : left === TOTAL ? 'スタート' : '再開'}
          </button>
          <button className="btn" onClick={() => { setRunning(false); setLeft(TOTAL) }}>リセット</button>
        </div>

        <div className="card mb-3">
          <h3 className="label">終値と前日比</h3>
          <PriceSummary prices={entry.prices} large />
        </div>
        {news.length > 0 && (
          <div className="card mb-3">
            <h3 className="label">主なニュース</h3>
            <ul className="list-disc space-y-1 pl-5">{news.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        )}
        {entry.explanation && (
          <details className="card">
            <summary className="label mb-0 cursor-pointer">自分の説明メモを見る</summary>
            <p className="mt-2 leading-relaxed whitespace-pre-wrap">{entry.explanation}</p>
          </details>
        )}
      </div>
    </div>
  )
}
