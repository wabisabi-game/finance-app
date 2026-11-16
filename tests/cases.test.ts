import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { buildCaseQuestions, mask, termTokens } from '../src/lib/cases'
import { seededRandom } from '../src/lib/drill'
import type { Term } from '../src/types'

const terms = readdirSync('content/terms').flatMap((f) => JSON.parse(readFileSync(join('content/terms', f), 'utf8')) as Term[])

it('用語名を伏せ字にする', () => {
  const vix = terms.find((t) => t.id === 'vix')!
  expect(termTokens(vix)).toEqual(expect.arrayContaining(['VIX指数', '恐怖指数', 'VIX']))
  expect(mask('VIXが過去最高の82.69', termTokens(vix))).toBe('〇〇が過去最高の82.69')
})

it('事例ごとに、正解を含む重複のない4択を作る', () => {
  const qs = buildCaseQuestions(terms, seededRandom(3))
  expect(qs.length).toBe(terms.reduce((n, t) => n + (t.cases?.length ?? 0), 0))
  for (const q of qs) {
    const t = terms.find((x) => x.id === q.termId)!
    expect(q.choices[q.answerIndex]).toBe(t.nameJa)
    expect(new Set(q.choices).size).toBe(4)
  }
})

it('言い換えた用語名も伏せ字になる（正解が問題文に出ない）', () => {
  for (const q of buildCaseQuestions(terms, seededRandom(1))) {
    const t = terms.find((x) => x.id === q.termId)!
    const core = t.nameJa.replace(/（.*?）/g, '')
    expect(q.prompt.includes(core), `${t.id}: ${core}`).toBe(false)
    expect(q.prompt.includes(core.slice(0, 3)), `${t.id}: ${core.slice(0, 3)}`).toBe(false)
  }
})
