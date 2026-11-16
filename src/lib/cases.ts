import type { Question, Term } from '../types'
import { shuffle } from './srs'

/** 用語名の言い換え（自動では拾えない形） */
const ALIASES: Record<string, string[]> = {
  tapering: ['テーパー'],
  'market-making': ['マーケットメイカー'],
}

/** 用語名の語尾を落とした形（日経平均株価→日経平均、減価償却費→減価償却） */
const SUFFIX = /(株価|株|費|比率|率)$/

/** 用語名を伏せ字にするための語を取り出す（「VIX指数（恐怖指数）」→ VIX指数、恐怖指数、VIX） */
export function termTokens(t: Term): string[] {
  const parts = [t.nameJa, t.nameEn]
    .flatMap((s) => s.split(/[（）()・/、,]|\s+[\/／]\s+|(?<=[^\x00-\x7F])と/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
  const stems = parts.map((s) => s.replace(SUFFIX, '')).filter((s) => s.length >= 2)
  const acronyms = [t.nameJa, t.nameEn].flatMap((s) => s.match(/[A-Z][A-Z&/0-9]{1,}/g) ?? [])
  return [...new Set([...parts, ...stems, ...acronyms, ...(ALIASES[t.id] ?? [])])].sort((a, b) => b.length - a.length)
}

export function mask(text: string, tokens: string[]): string {
  return tokens.reduce((s, tok) => s.split(tok).join('〇〇'), text)
}

/** 過去の事例から「どの用語の事例か」を当てる4択を作る。復習の記録には使わない */
export function buildCaseQuestions(terms: readonly Term[], random: () => number = Math.random): Question[] {
  const withCases = terms.filter((t) => t.cases?.length)
  return shuffle(
    withCases.flatMap((t) =>
      (t.cases ?? []).map((c, i) => {
        const sameCategory = terms.filter((o) => o.id !== t.id && o.category === t.category)
        const pool = sameCategory.length >= 3 ? sameCategory : terms.filter((o) => o.id !== t.id)
        const others = shuffle(pool, random).slice(0, 3).map((o) => o.nameJa)
        const tokens = termTokens(t)
        return {
          id: `case:${t.id}:${i}`,
          termId: t.id,
          type: 'choice' as const,
          prompt: `【${c.date}】${mask(c.title, tokens)}\n${mask(c.detail, tokens)}\n\nこの出来事と最も関係の深い用語は？`,
          choices: [t.nameJa, ...others],
          answerIndex: 0,
          explanation: `「${t.nameJa}」の事例です。${t.summary}`,
        }
      }),
    ),
    random,
  )
}
