import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Question, Term } from '../src/types'

const load = <T>(dir: string): T[] =>
  readdirSync(join('content', dir))
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join('content', dir, f), 'utf8')) as T[])

const terms = load<Term>('terms')
const questions = load<Question>('questions')
const termIds = new Set(terms.map((t) => t.id))
const CATEGORIES = ['rates', 'macro', 'equity', 'fx', 'credit', 'accounting', 'career']

describe('content', () => {
  it('用語：idが一意で、必須項目が埋まっている', () => {
    expect(termIds.size).toBe(terms.length)
    for (const t of terms) {
      expect(CATEGORIES, t.id).toContain(t.category)
      for (const k of ['nameJa', 'nameEn', 'summary', 'detail', 'marketImpact', 'example', 'source'] as const) {
        expect(t[k], `${t.id}.${k}`).toBeTruthy()
      }
      expect([...t.summary].length, `${t.id} の一言説明は50字以内`).toBeLessThanOrEqual(50)
    }
  })

  it('用語：関連用語のリンク先が存在する', () => {
    for (const t of terms) for (const r of t.related) expect(termIds.has(r), `${t.id} → ${r}`).toBe(true)
  })

  it('問題：idが一意で、用語にひも付き、正解の番号が選択肢の範囲内', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length)
    for (const q of questions) {
      expect(termIds.has(q.termId), `${q.id} → ${q.termId}`).toBe(true)
      expect(['choice', 'truefalse', 'causal'], q.id).toContain(q.type)
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2)
      expect(new Set(q.choices).size, `${q.id} の選択肢が重複`).toBe(q.choices.length)
      expect(q.answerIndex >= 0 && q.answerIndex < q.choices.length, q.id).toBe(true)
      if (q.type === 'truefalse') expect(q.choices, q.id).toEqual(['○', '×'])
      expect(q.prompt && q.explanation, q.id).toBeTruthy()
    }
  })

  it('1語につき2問以上ある', () => {
    for (const t of terms) {
      expect(questions.filter((q) => q.termId === t.id).length, t.id).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('cases and sources', () => {
  it('事例と出典の形がそろっている', () => {
    for (const t of terms) {
      for (const c of t.cases ?? []) {
        expect(c.date && c.title && c.detail, t.id).toBeTruthy()
      }
      for (const s of t.sources ?? []) {
        expect(s.label, t.id).toBeTruthy()
        expect(s.url, `${t.id} ${s.url}`).toMatch(/^https:\/\//)
      }
      if (t.cases?.length) expect(t.sources?.length, `${t.id} は事例があるのに出典がない`).toBeGreaterThan(0)
      if (t.verification === 'sourced') expect(t.sources?.length, t.id).toBeGreaterThan(0)
    }
  })
})
