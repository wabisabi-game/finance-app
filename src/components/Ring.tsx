/** 進み具合を示す円グラフ。value は 0〜1 */
export default function Ring({
  value,
  size = 96,
  stroke = 9,
  tone = 'accent',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: 'accent' | 'good'
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-raised" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={`transition-[stroke-dashoffset] duration-700 ease-out ${tone === 'good' ? 'stroke-good' : 'stroke-accent'}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
