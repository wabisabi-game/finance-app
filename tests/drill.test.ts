import { describe, expect, it } from 'vitest'
import {
  diagnose, equity, generateCompany, isClose, METRICS, netIncome, operatingProfit, pickMetrics, seededRandom,
  totalAssets, totalLiabilities,
} from '../src/lib/drill'

describe('generateCompany', () => {
  it('数字が整合した会社を作る（BSが一致し、黒字で、すべての指標が有限）', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const c = generateCompany(seededRandom(seed))
      expect(totalAssets(c)).toBe(totalLiabilities(c) + equity(c))
      expect(equity(c)).toBeGreaterThan(0)
      expect(operatingProfit(c)).toBeGreaterThan(0)
      expect(netIncome(c)).toBeGreaterThan(0)
      for (const v of Object.values(c)) if (typeof v === 'number') expect(Number.isInteger(v)).toBe(true)
      for (const m of METRICS) expect(Number.isFinite(m.value(c)), `${seed} ${m.id}`).toBe(true)
      expect(diagnose(c)).toHaveLength(6)
    }
  })

  it('同じシードなら同じ会社になる', () => {
    expect(generateCompany(seededRandom(42))).toEqual(generateCompany(seededRandom(42)))
  })
})

describe('isClose', () => {
  it('単位ごとの許容誤差で判定する', () => {
    expect(isClose(12.3, 12.6, '%')).toBe(true)
    expect(isClose(12.0, 12.6, '%')).toBe(false)
    expect(isClose(120, 121, '億円')).toBe(true)
    expect(isClose(118, 120, '億円')).toBe(false)
    expect(isClose(1.5, 1.55, '回')).toBe(true)
    expect(isClose(1.3, 1.55, '回')).toBe(false)
    expect(isClose(20, 20.5, '倍')).toBe(true)
  })
})

it('pickMetrics は重複なく選ぶ', () => {
  const ids = pickMetrics(5, seededRandom(7)).map((m) => m.id)
  expect(new Set(ids).size).toBe(5)
})
