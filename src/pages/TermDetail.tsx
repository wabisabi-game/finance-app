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

      <Section title="出典メモ">
        <p className="text-sm">{term.source}</p>
        {!term.verified && (
          <p className="bg-warn-soft text-warn mt-3 rounded-xl px-3 py-2 text-xs font-medium">
            裏取り前：この用語はAIが下書きしたもので、出典での確認がまだ済んでいません。
          </p>
        )}
      </Section>
    </>
  )
}
