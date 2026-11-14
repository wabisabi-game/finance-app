export type Category = 'rates' | 'macro' | 'equity' | 'fx' | 'credit' | 'career'

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
  /** 出典で裏を取ったら true にする。未設定は「裏取り前」として表示する */
  verified?: boolean
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

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  dailyCount: number
}
