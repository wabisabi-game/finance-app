import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { categoryColor, categoryLabel, questionsForTerm, termById } from '../lib/content'
import { getMastered, setMastered } from '../lib/db'
import { useData } from '../lib/useData'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mb-3">
      <h2 className="label">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermDetail() {
  const { id = '' } = useParams()
  const term = termById.get(id)
  const [mastered, reload] = useData(getMastered)

  if (!term) {
    return (
      <>
        <PageHeader title="用語が見つかりません" back="/dictionary" />
        <p className="card muted">この用語は辞書にありません。</p>
      </>
    )
  }

  const isMastered = mastered?.has(term.id) ?? false
  const quizCount = questionsForTerm(term.id).length

  return (
    <>
      <PageHeader title={term.nameJa} back="/dictionary" />
      <p className="muted -mt-3 mb-5 flex flex-wrap items-center gap-x-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(term.category) }} />
          {categoryLabel(term.category)}
        </span>
        <span>{term.nameEn}</span>
      </p>

      <p className="border-accent mb-5 border-l-4 pl-4 text-lg leading-relaxed font-bold">{term.summary}</p>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <button
          className={isMastered ? 'btn border-good! bg-good-soft! text-good!' : 'btn'}
          aria-pressed={isMastered}
          onClick={async () => {
            await setMastered(term.id, !isMastered)
            reload()
          }}
        >
          {isMastered ? '✓ 覚えた' : '覚えた にする'}
        </button>
        <Link to={`/quiz/practice?term=${term.id}`} className="btn">この用語のクイズ（{quizCount}問）</Link>
      </div>

      <Section title="詳しい説明">{term.detail}</Section>
      <Section title="市場で何が起きるか">{term.marketImpact}</Section>
      <Section title="ニュースでの使われ方">{term.example}</Section>

      {term.cases && term.cases.length > 0 && (
        <section className="card mb-3">
          <h2 className="label">過去の事例</h2>
          <ol className="border-accent/30 relative ml-1.5 space-y-5 border-l-2 pl-5">
            {term.cases.map((c) => (
              <li key={c.date + c.title} className="relative">
                <span className="bg-accent ring-surface absolute top-1.5 -left-[27px] h-3 w-3 rounded-full ring-4" aria-hidden="true" />
                <p className="text-accent-ink text-xs font-bold tracking-wide">{c.date}</p>
                <p className="mt-0.5 font-bold leading-snug">{c.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed">{c.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {term.related.length > 0 && (
        <Section title="関連用語">
          <div className="flex flex-wrap gap-2">
            {term.related.map((r) => {
              const t = termById.get(r)
              return t ? <Link key={r} to={`/dictionary/${r}`} className="chip text-ink!">{t.nameJa}</Link> : null
            })}
          </div>
        </Section>
      )}

      <Section title="出典">
        {term.verification === 'sourced' ? (
          <p className="bg-good-soft text-good mb-3 rounded-xl px-3 py-2 text-xs font-bold">確認済み：説明と事例の日付・数値を、下の出典と照合しました（2026年11月）。</p>
        ) : term.verification === 'reviewed' ? (
          <p className="bg-raised text-sub mb-3 rounded-xl px-3 py-2 text-xs font-bold">定義を見直し済み：一般的な定義と照合しました。個別の出典リンクはありません。</p>
        ) : (
          <p className="bg-warn-soft text-warn mb-3 rounded-xl px-3 py-2 text-xs font-medium">確認前：AIの下書きで、出典での確認がまだ済んでいません。</p>
        )}
        {term.sources && term.sources.length > 0 && (
          <ul className="mb-3 space-y-1.5 text-sm">
            {term.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline decoration-1 underline-offset-4">{s.label}</a>
              </li>
            ))}
          </ul>
        )}
        <p className="muted text-xs">参考：{term.source.replace(/^要確認：/, '')}</p>
      </Section>
    </>
  )
}
