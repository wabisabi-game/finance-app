import { describe, expect, it } from 'vitest'
import { applyAnswer, buildDailySession } from '../src/lib/srs'
import { computeStreak, weakTerms } from '../src/lib/stats'
import { parseBackup } from '../src/lib/backup'
import type { Question, ReviewState, StudyLog } from '../src/types'

const q = (id: string, termId = 't'): Question => ({
  id, termId, type: 'choice', prompt: '', choices: ['a', 'b'], answerIndex: 0, explanation: '',
})

describe('applyAnswer', () => {
  it('正解のたびに 1→3→7→14→30日と延び、30日で頭打ちになる', () => {
    let s: ReviewState | undefined
    const seen: number[] = []
    for (let i = 0; i < 7; i++) {
      s = applyAnswer(s, 'q1', true, '2026-11-01')
      seen.push(s.intervalDays)
    }
    expect(seen).toEqual([1, 3, 7, 14, 30, 30, 30])
    expect(s!.nextDue).toBe('2026-12-01')
  })

  it('不正解で1日に戻る', () => {
    let s = applyAnswer(undefined, 'q1', true, '2026-11-01')
    s = applyAnswer(s, 'q1', true, '2026-11-02')
    s = applyAnswer(s, 'q1', false, '2026-11-30')
    expect(s).toMatchObject({ intervalDays: 1, correctStreak: 0, nextDue: '2026-12-01', seen: 3, correct: 2 })
    expect(applyAnswer(s, 'q1', true, '2026-12-01').intervalDays).toBe(1)
  })

  it('自主演習の正解は間隔を延ばさないが、不正解は1日に戻す', () => {
    const s = applyAnswer(applyAnswer(undefined, 'q1', true, '2026-11-01'), 'q1', true, '2026-11-02')
    const practiced = applyAnswer(s, 'q1', true, '2026-11-03', false)
    expect(practiced).toMatchObject({ intervalDays: 3, nextDue: s.nextDue, seen: 3, correct: 3 })
    expect(applyAnswer(s, 'q1', false, '2026-11-03', false)).toMatchObject({ intervalDays: 1, nextDue: '2026-11-04' })
  })
})

describe('buildDailySession', () => {
  const questions = Array.from({ length: 40 }, (_, i) => q(`q${i}`))
  const review = (i: number, nextDue: string): ReviewState => ({
    questionId: `q${i}`, intervalDays: 1, nextDue, correctStreak: 1, lastAnsweredAt: '2026-11-01', seen: 1, correct: 1,
  })

  it('10問なら復習7問＋新規3問', () => {
    const reviews = Array.from({ length: 20 }, (_, i) => review(i, '2026-11-10'))
    const s = buildDailySession(questions, reviews, '2026-11-14', 10)
    const reviewed = new Set(reviews.map((r) => r.questionId))
    expect(s.questionIds).toHaveLength(10)
    expect(new Set(s.questionIds).size).toBe(10)
    expect(s.questionIds.filter((id) => reviewed.has(id))).toHaveLength(7)
  })

  it('復習が足りなければ新規で埋め、期日前の問題は出さない', () => {
    const reviews = [review(0, '2026-11-14'), review(1, '2026-11-20')]
    const s = buildDailySession(questions, reviews, '2026-11-14', 10)
    expect(s.questionIds).toHaveLength(10)
    expect(s.questionIds).toContain('q0')
    expect(s.questionIds).not.toContain('q1')
  })

  it('新規が尽きたら復習で埋める', () => {
    const few = questions.slice(0, 12)
    const reviews = Array.from({ length: 11 }, (_, i) => review(i, '2026-11-10'))
    const s = buildDailySession(few, reviews, '2026-11-14', 10)
    expect(s.questionIds).toHaveLength(10)
    expect(s.questionIds).toContain('q11')
  })
})

describe('stats', () => {
  const log = (date: string, quizDone: boolean, journalDone = false): StudyLog => ({
    date, quizDone, journalDone, correctCount: 0, answeredCount: 0,
  })

  it('連続日数は今日が未完了でも昨日までを数え、途切れたら止まる', () => {
    const logs = [log('2026-11-10', true), log('2026-11-12', true), log('2026-11-13', false, true)]
    expect(computeStreak(logs, '2026-11-14')).toBe(2)
    expect(computeStreak([...logs, log('2026-11-14', true)], '2026-11-14')).toBe(3)
    expect(computeStreak(logs, '2026-11-16')).toBe(0)
  })

  it('苦手用語は正答率の低い順で、全問正解の用語は含めない', () => {
    const r = (questionId: string, seen: number, correct: number): ReviewState => ({
      questionId, seen, correct, intervalDays: 1, nextDue: '', correctStreak: 0, lastAnsweredAt: '',
    })
    const byId = new Map([['a1', q('a1', 'a')], ['b1', q('b1', 'b')], ['c1', q('c1', 'c')]])
    const weak = weakTerms([r('a1', 4, 3), r('b1', 4, 1), r('c1', 2, 2)], byId)
    expect(weak.map((w) => w.termId)).toEqual(['b', 'a'])
  })
})

describe('parseBackup', () => {
  it('形の違うファイルを拒否する', () => {
    expect(() => parseBackup('not json')).toThrow()
    expect(() => parseBackup('{"app":"other","version":1}')).toThrow()
    expect(() => parseBackup('{"app":"finance-app","version":1,"reviews":[{}],"journal":[],"logs":[],"mastered":[]}')).toThrow()
    const ok = parseBackup('{"app":"finance-app","version":1,"exportedAt":"","reviews":[],"journal":[],"logs":[],"mastered":["fomc"]}')
    expect(ok.mastered).toEqual(['fomc'])
  })
})
