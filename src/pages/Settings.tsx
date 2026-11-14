import { useRef, useState } from 'react'
import { PageHeader } from '../components/Layout'
import { parseBackup, type Backup } from '../lib/backup'
import { questions, terms } from '../lib/content'
import { todayStr } from '../lib/date'
import { exportAll, replaceAll } from '../lib/db'
import { loadSettings, saveSettings } from '../lib/settings'
import type { Settings as SettingsType } from '../types'

const THEMES: { id: SettingsType['theme']; label: string }[] = [
  { id: 'system', label: '端末に合わせる' },
  { id: 'light', label: 'ライト' },
  { id: 'dark', label: 'ダーク' },
]

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings)
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const fileRef = useRef<HTMLInputElement>(null)

  function update(patch: Partial<SettingsType>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  async function onExport() {
    const backup: Backup = { app: 'finance-app', version: 1, exportedAt: new Date().toISOString(), settings, ...(await exportAll()) }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `market-dojo-backup-${todayStr()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage({ ok: true, text: `エクスポートしました（日記 ${backup.journal.length}件、復習状態 ${backup.reviews.length}件）` })
  }

  async function onImport(file: File) {
    try {
      const backup = parseBackup(await file.text())
      const ok = confirm(`現在のデータをすべて置き換えます。\n\nバックアップ：日記 ${backup.journal.length}件、復習状態 ${backup.reviews.length}件\n作成日時：${backup.exportedAt}\n\nよろしいですか？`)
      if (!ok) return
      await replaceAll(backup)
      if (backup.settings) update(backup.settings)
      setMessage({ ok: true, text: 'インポートしました。' })
    } catch (e) {
      setMessage({ ok: false, text: `インポートできませんでした：${e instanceof Error ? e.message : String(e)}` })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <PageHeader title="設定" back="/" />

      <section className="card mb-3">
        <label htmlFor="dailyCount" className="label">1日の出題数</label>
        <select id="dailyCount" className="input" value={settings.dailyCount} onChange={(e) => update({ dailyCount: Number(e.target.value) })}>
          {[5, 10, 15, 20, 30].map((n) => (
            <option key={n} value={n}>{n}問（新規{Math.round(n * 0.3)}＋復習{n - Math.round(n * 0.3)}）</option>
          ))}
        </select>
        <p className="muted mt-2 text-xs">今日の出題はすでに決まっているため、変更は明日の分から反映されます。</p>
      </section>

      <section className="card mb-3">
        <span className="label">テーマ</span>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button key={t.id} aria-pressed={settings.theme === t.id} className={`min-h-12 rounded-2xl text-sm font-bold transition active:scale-95 ${settings.theme === t.id ? 'bg-accent text-white' : 'bg-raised/60 text-sub'}`} onClick={() => update({ theme: t.id })}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card mb-3">
        <h2 className="label">データのバックアップ</h2>
        <p className="muted mb-3 text-sm">学習記録と日記はこの端末のブラウザ内だけに保存されています。機種変更やブラウザのデータ消去に備えて、ときどきエクスポートしてください。</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => void onExport()}>エクスポート</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>インポート</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && void onImport(e.target.files[0])} />
        {message && <p role="status" className={`mt-3 text-sm ${message.ok ? 'text-good' : 'text-bad'}`}>{message.text}</p>}
      </section>

      <p className="muted text-center text-xs">収録：用語 {terms.length}語・問題 {questions.length}問</p>
    </>
  )
}
