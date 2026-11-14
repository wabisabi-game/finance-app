import { formatChange, formatNumber, PRICE_FIELDS } from '../lib/journal'
import type { JournalEntry } from '../types'

export default function PriceSummary({ prices, large = false }: { prices: JournalEntry['prices']; large?: boolean }) {
  const filled = PRICE_FIELDS.filter((f) => prices[f.key].close !== null || prices[f.key].change !== null)
  if (filled.length === 0) return null
  return (
    <dl className={`grid gap-x-4 gap-y-1 ${large ? 'grid-cols-2 text-base' : 'grid-cols-2 text-xs sm:grid-cols-3'}`}>
      {filled.map((f) => {
        const p = prices[f.key]
        const tone = p.change === null || p.change === 0 ? 'muted' : p.change > 0 ? 'text-good' : 'text-bad'
        return (
          <div key={f.key} className="flex items-baseline justify-between gap-2 tabular-nums">
            <dt className="muted">{large ? f.label : f.short}</dt>
            <dd>
              {formatNumber(p.close)} <span className={tone}>{formatChange(p.change)}</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
