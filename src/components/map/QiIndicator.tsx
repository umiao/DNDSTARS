import { Wind } from 'lucide-react'
import { isShadowDancer } from '../../lib/characterClasses'
import { maxQiForLevel } from '../../lib/traitRegistry'

export default function QiIndicator({
  charClass,
  level = 1,
  qi = 0,
  compact = false,
}: {
  charClass: string
  level?: number
  qi?: number
  compact?: boolean
}) {
  if (!isShadowDancer(charClass)) return null
  const max = maxQiForLevel(level)
  const value = Math.min(max, Math.max(0, qi))

  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-lg bg-violet-500/10',
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
      ].join(' ')}
    >
      <Wind className={compact ? 'h-3 w-3 text-violet-300' : 'h-4 w-4 text-violet-300'} />
      <span className="text-slate-300">气</span>
      <span className="font-bold tabular-nums text-violet-100">
        {value}
        <span className="text-slate-500">/{max}</span>
      </span>
    </div>
  )
}
