export type Category = 'rates' | 'macro' | 'equity' | 'fx' | 'credit' | 'accounting' | 'career'

export interface TermCase {
  /** 時期（例：2024年8月5日、2022年6月〜11月） */
  date: string
  title: string
  detail: string
}

export interface SourceLink {
  label: string
  url: string
}

export interface Term {
  id: string
  nameJa: string
  nameEn: string
  category: Category
  summary: string
  detail: string
  marketImpact: string
  related: string[]
  example: string
  source: string
  /** 過去に実際にあった出来事 */
  cases?: TermCase[]
  /** 内容を確認した出典 */
  sources?: SourceLink[]
  /** sourced：出典で確認済み / reviewed：定義を見直し済み（個別の出典リンクなし）/ 未設定：確認前 */
  verification?: 'sourced' | 'reviewed'
}

export type QuestionType = 'choice' | 'truefalse' | 'causal'

export interface Question {
  id: string
  termId: string
  type: QuestionType
  prompt: string
  choices: string[]
  answerIndex: number
  explanation: string
}

export interface ReviewState {
  questionId: string
  intervalDays: number
  nextDue: string
  correctStreak: number
  lastAnsweredAt: string
  /** 累計の回答数と正解数（正答率の集計用） */
  seen: number
  correct: number
}

export const PRICE_KEYS = ['nikkei', 'spx', 'ust10y', 'usdjpy', 'wti', 'vix'] as const
export type PriceKey = (typeof PRICE_KEYS)[number]

export interface PricePoint {
  close: number | null
  change: number | null
}

export interface JournalEntry {
  date: string
  prices: Record<PriceKey, PricePoint>
  news: string[]
  explanation: string
  confidence: number
  review: string
  tags: string[]
  updatedAt: string
}

export interface StudyLog {
  date: string
  quizDone: boolean
  correctCount: number
  answeredCount: number
  journalDone: boolean
}

export interface DailySession {
  date: string
  questionIds: string[]
  /** questionId → 正解したか */
  answers: Record<string, boolean>
}

/** 計算ドリルの指標ごとの成績 */
export interface DrillStat {
  metric: string
  seen: number
  correct: number
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  dailyCount: number
}
