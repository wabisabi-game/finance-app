/**
 * 会計の計算ドリル。数字の整合した架空の会社（PL・BS・CF）を作り、財務指標を計算させる。
 * 単位はすべて億円。簡単のため、ROEなどは期首・期末の平均ではなく期末の数字で計算する。
 */

export const TAX_RATE = 0.3
/** ROICと比べる資本コストの仮置き */
export const ASSUMED_WACC = 6

export interface Company {
  name: string
  // PL
  sales: number
  cogs: number
  sga: number
  interest: number
  tax: number
  // BS
  cash: number
  receivables: number
  inventory: number
  ppe: number
  payables: number
  shortDebt: number
  longDebt: number
  // CF
  depreciation: number
  workingCapitalIncrease: number
  capex: number
  financingCF: number
  // 市場
  marketCap: number
}

export const grossProfit = (c: Company) => c.sales - c.cogs
export const operatingProfit = (c: Company) => c.sales - c.cogs - c.sga
export const pretaxProfit = (c: Company) => operatingProfit(c) - c.interest
export const netIncome = (c: Company) => pretaxProfit(c) - c.tax
export const currentAssets = (c: Company) => c.cash + c.receivables + c.inventory
export const totalAssets = (c: Company) => currentAssets(c) + c.ppe
export const currentLiabilities = (c: Company) => c.payables + c.shortDebt
export const totalLiabilities = (c: Company) => currentLiabilities(c) + c.longDebt
export const equity = (c: Company) => totalAssets(c) - totalLiabilities(c)
export const debt = (c: Company) => c.shortDebt + c.longDebt
export const operatingCF = (c: Company) => netIncome(c) + c.depreciation - c.workingCapitalIncrease
export const investingCF = (c: Company) => -c.capex
export const ebitda = (c: Company) => operatingProfit(c) + c.depreciation
export const netDebt = (c: Company) => debt(c) - c.cash

export type Statement = 'PL' | 'BS' | 'CF' | '市場'
export type Unit = '%' | '倍' | '回' | '億円'

export interface Metric {
  id: string
  label: string
  unit: Unit
  /** 関連する用語（辞書へのリンク） */
  termId: string
  uses: Statement[]
  formula: string
  value: (c: Company) => number
  /** 数字を当てはめた計算過程 */
  working: (c: Company) => string
}

const f = (n: number, digits = 0) => n.toLocaleString('ja-JP', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const pct = (a: number, b: number) => (a / b) * 100

export const METRICS: Metric[] = [
  {
    id: 'operating-margin', label: '営業利益率', unit: '%', termId: 'operating-margin', uses: ['PL'],
    formula: '営業利益 ÷ 売上高 × 100',
    value: (c) => pct(operatingProfit(c), c.sales),
    working: (c) => `${f(operatingProfit(c))} ÷ ${f(c.sales)} × 100`,
  },
  {
    id: 'roe', label: 'ROE', unit: '%', termId: 'roe', uses: ['PL', 'BS'],
    formula: '当期純利益 ÷ 純資産 × 100',
    value: (c) => pct(netIncome(c), equity(c)),
    working: (c) => `${f(netIncome(c))} ÷ ${f(equity(c))} × 100`,
  },
  {
    id: 'roa', label: 'ROA', unit: '%', termId: 'roa', uses: ['PL', 'BS'],
    formula: '当期純利益 ÷ 総資産 × 100',
    value: (c) => pct(netIncome(c), totalAssets(c)),
    working: (c) => `${f(netIncome(c))} ÷ ${f(totalAssets(c))} × 100`,
  },
  {
    id: 'roic', label: 'ROIC', unit: '%', termId: 'roic', uses: ['PL', 'BS'],
    formula: '営業利益 ×（1 − 税率30%）÷（有利子負債 ＋ 純資産）× 100',
    value: (c) => pct(operatingProfit(c) * (1 - TAX_RATE), debt(c) + equity(c)),
    working: (c) =>
      `NOPAT ${f(operatingProfit(c))} × 0.7 ＝ ${f(operatingProfit(c) * 0.7, 1)}、投下資本 ${f(c.shortDebt)} ＋ ${f(c.longDebt)} ＋ ${f(equity(c))} ＝ ${f(debt(c) + equity(c))}。${f(operatingProfit(c) * 0.7, 1)} ÷ ${f(debt(c) + equity(c))} × 100`,
  },
  {
    id: 'equity-ratio', label: '自己資本比率', unit: '%', termId: 'equity-ratio', uses: ['BS'],
    formula: '純資産 ÷ 総資産 × 100',
    value: (c) => pct(equity(c), totalAssets(c)),
    working: (c) => `${f(equity(c))} ÷ ${f(totalAssets(c))} × 100`,
  },
  {
    id: 'current-ratio', label: '流動比率', unit: '%', termId: 'current-ratio', uses: ['BS'],
    formula: '流動資産 ÷ 流動負債 × 100',
    value: (c) => pct(currentAssets(c), currentLiabilities(c)),
    working: (c) => `${f(currentAssets(c))} ÷ ${f(currentLiabilities(c))} × 100`,
  },
  {
    id: 'asset-turnover', label: '総資産回転率', unit: '回', termId: 'asset-turnover', uses: ['PL', 'BS'],
    formula: '売上高 ÷ 総資産',
    value: (c) => c.sales / totalAssets(c),
    working: (c) => `${f(c.sales)} ÷ ${f(totalAssets(c))}`,
  },
  {
    id: 'ebitda', label: 'EBITDA', unit: '億円', termId: 'ebitda', uses: ['PL', 'CF'],
    formula: '営業利益 ＋ 減価償却費',
    value: ebitda,
    working: (c) => `${f(operatingProfit(c))} ＋ ${f(c.depreciation)}`,
  },
  {
    id: 'fcf', label: 'フリーキャッシュフロー', unit: '億円', termId: 'fcf', uses: ['CF'],
    formula: '営業CF ＋ 投資CF',
    value: (c) => operatingCF(c) + investingCF(c),
    working: (c) => `${f(operatingCF(c))} ＋（${f(investingCF(c))}）`,
  },
  {
    id: 'net-debt', label: 'ネットデット', unit: '億円', termId: 'net-debt', uses: ['BS'],
    formula: '（短期借入金 ＋ 長期借入金）− 現金及び預金',
    value: netDebt,
    working: (c) => `（${f(c.shortDebt)} ＋ ${f(c.longDebt)}）− ${f(c.cash)}`,
  },
  {
    id: 'net-debt-ebitda', label: 'ネットデット/EBITDA', unit: '倍', termId: 'net-debt', uses: ['PL', 'BS', 'CF'],
    formula: '（有利子負債 − 現預金）÷（営業利益 ＋ 減価償却費）',
    value: (c) => netDebt(c) / ebitda(c),
    working: (c) => `${f(netDebt(c))} ÷ ${f(ebitda(c))}`,
  },
  {
    id: 'interest-coverage', label: 'インタレスト・カバレッジ・レシオ', unit: '倍', termId: 'interest-coverage', uses: ['PL'],
    formula: '営業利益 ÷ 支払利息',
    value: (c) => operatingProfit(c) / c.interest,
    working: (c) => `${f(operatingProfit(c))} ÷ ${f(c.interest)}`,
  },
  {
    id: 'per', label: 'PER', unit: '倍', termId: 'per', uses: ['PL', '市場'],
    formula: '時価総額 ÷ 当期純利益',
    value: (c) => c.marketCap / netIncome(c),
    working: (c) => `${f(c.marketCap)} ÷ ${f(netIncome(c))}`,
  },
  {
    id: 'ev-ebitda', label: 'EV/EBITDA', unit: '倍', termId: 'ev-ebitda', uses: ['BS', 'CF', 'PL', '市場'],
    formula: '（時価総額 ＋ ネットデット）÷ EBITDA',
    value: (c) => (c.marketCap + netDebt(c)) / ebitda(c),
    working: (c) => `EV ${f(c.marketCap)} ＋ ${f(netDebt(c))} ＝ ${f(c.marketCap + netDebt(c))}。${f(c.marketCap + netDebt(c))} ÷ ${f(ebitda(c))}`,
  },
]

export const metricById = new Map(METRICS.map((m) => [m.id, m]))

/** 答えを丸めて表示するときの桁数 */
export const digitsFor = (u: Unit) => (u === '億円' ? 0 : u === '%' ? 1 : 2)

/** 許容誤差。暗算や途中の四捨五入による小さなずれは正解にする */
export function isClose(answer: number, truth: number, unit: Unit): boolean {
  const tol = unit === '%' ? 0.5 : unit === '億円' ? 1 : Math.max(0.1, Math.abs(truth) * 0.03)
  return Math.abs(answer - truth) <= tol + 1e-9
}

export function formatValue(n: number, unit: Unit): string {
  const s = f(n, digitsFor(unit))
  return unit === '%' ? `${s}%` : `${s}${unit}`
}

/** 再現できる乱数（テスト用にシードを渡せる） */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAMES = ['あおば精機', 'みなと化学', 'さくら食品', 'ひかり電子', 'つばさ物流', 'やまと建機', 'こはく製薬', 'しらかば小売', 'あかね通信', 'みずほ素材']

export function generateCompany(random: () => number = Math.random): Company {
  const between = (lo: number, hi: number) => lo + (hi - lo) * random()
  const round = (n: number) => Math.round(n)
  for (;;) {
    const sales = round(between(80, 1200)) * 10
    const grossMargin = between(0.18, 0.55)
    const opMargin = between(0.02, Math.min(0.2, grossMargin - 0.06))
    const cogs = round(sales * (1 - grossMargin))
    const sga = round(sales * grossMargin - sales * opMargin)
    const ta = sales / between(0.6, 1.6)
    const cash = round(ta * between(0.04, 0.2))
    const receivables = round(ta * between(0.08, 0.2))
    const inventory = round(ta * between(0.04, 0.18))
    const ppe = round(ta) - cash - receivables - inventory
    const payables = round(ta * between(0.05, 0.15))
    const shortDebt = round(ta * between(0.01, 0.14))
    const longDebt = round(ta * between(0.05, 0.42))
    const interest = Math.max(1, round((shortDebt + longDebt) * between(0.005, 0.03)))
    const c: Company = {
      name: NAMES[Math.floor(random() * NAMES.length)],
      sales, cogs, sga, interest, tax: 0,
      cash, receivables, inventory, ppe, payables, shortDebt, longDebt,
      depreciation: round(ppe * between(0.05, 0.12)),
      workingCapitalIncrease: round(sales * between(-0.02, 0.03)),
      capex: 0,
      financingCF: 0,
      marketCap: 0,
    }
    const pretax = pretaxProfit(c)
    if (pretax <= 0 || equity(c) <= 0 || ppe <= 0) continue
    c.tax = round(pretax * TAX_RATE)
    const ni = netIncome(c)
    if (ni <= 0) continue
    c.capex = round(c.depreciation * between(0.7, 1.9))
    c.financingCF = -round(ni * between(0.2, 0.7))
    c.marketCap = round(ni * between(8, 30))
    if (ebitda(c) <= 0 || operatingCF(c) <= 0) continue
    return c
  }
}

/** 1社につき、重複しないように指標を選ぶ */
export function pickMetrics(count: number, random: () => number = Math.random): Metric[] {
  const pool = [...METRICS]
  const out: Metric[] = []
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  return out
}

export interface Finding {
  label: string
  value: string
  tone: 'good' | 'bad' | 'neutral'
  note: string
}

/** 計算した指標から、会社の状態を目安で読む */
export function diagnose(c: Company): Finding[] {
  const om = pct(operatingProfit(c), c.sales)
  const roic = pct(operatingProfit(c) * (1 - TAX_RATE), debt(c) + equity(c))
  const er = pct(equity(c), totalAssets(c))
  const cr = pct(currentAssets(c), currentLiabilities(c))
  const nd = netDebt(c)
  const fcf = operatingCF(c) + investingCF(c)
  return [
    {
      label: '収益性（営業利益率）', value: formatValue(om, '%'),
      tone: om >= 10 ? 'good' : om < 5 ? 'bad' : 'neutral',
      note: om >= 10 ? '本業の利益率は高め。価格決定力がある可能性。' : om < 5 ? '利益率は低め。コスト増に弱い可能性。業種差に注意。' : '標準的な水準。同業他社との比較が必要。',
    },
    {
      label: '資本効率（ROIC）', value: formatValue(roic, '%'),
      tone: roic >= ASSUMED_WACC ? 'good' : 'bad',
      note: roic >= ASSUMED_WACC
        ? `資本コスト（仮に${ASSUMED_WACC}%）を上回り、企業価値を生んでいる。`
        : `資本コスト（仮に${ASSUMED_WACC}%）を下回り、価値を生めていない。`,
    },
    {
      label: '安全性（自己資本比率）', value: formatValue(er, '%'),
      tone: er >= 40 ? 'good' : er < 25 ? 'bad' : 'neutral',
      note: er >= 50 ? '財務は厚い。一方で資本を使い切れていない可能性も。' : er >= 40 ? '財務は健全な水準。' : er < 25 ? '借入への依存が大きい。金利上昇に弱い。' : '標準的な水準。',
    },
    {
      label: '短期の支払い能力（流動比率）', value: formatValue(cr, '%'),
      tone: cr >= 150 ? 'good' : cr < 100 ? 'bad' : 'neutral',
      note: cr >= 200 ? '1年以内の支払いに十分な余裕がある。' : cr >= 150 ? '概ね問題のない水準。' : cr < 100 ? '流動負債が流動資産を上回る。資金繰りに注意。' : 'やや余裕が小さい。',
    },
    {
      label: '借入の重さ（ネットデット/EBITDA）', value: nd <= 0 ? '実質無借金' : formatValue(nd / ebitda(c), '倍'),
      tone: nd <= 0 || nd / ebitda(c) <= 2 ? 'good' : nd / ebitda(c) > 3 ? 'bad' : 'neutral',
      note: nd <= 0 ? '現預金が有利子負債を上回る。' : nd / ebitda(c) > 3 ? '借入は稼ぎの3年分超。重めの水準。' : '稼ぎで無理なく返せる水準。',
    },
    {
      label: 'キャッシュフロー', value: `FCF ${formatValue(fcf, '億円')}`,
      tone: fcf >= 0 ? 'good' : 'neutral',
      note: fcf >= 0
        ? '営業＋・投資−・財務−。本業の稼ぎで投資し、返済や還元もしている安定型。'
        : '投資が営業CFを上回る。成長投資か、稼ぐ力の不足か、中身を確認したい。',
    },
  ]
}
