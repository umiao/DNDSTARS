import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  metaChoiceLabel,
  type TraitChoiceGroup,
  type TraitChoiceOption,
} from '../../lib/traitRegistry'

function optionKey(opt: TraitChoiceOption): string {
  return opt.kind === 'feature' ? opt.featureKey! : opt.metaKey!
}

interface TraitChoicePanelProps {
  group: TraitChoiceGroup
  onConfirm: (selected: TraitChoiceOption[]) => void
}

export default function TraitChoicePanel({ group, onConfirm }: TraitChoicePanelProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (group.pickCount === 1) return [key]
      if (prev.length >= group.pickCount) return prev
      return [...prev, key]
    })
  }

  if (group.autoGrant?.length || group.autoGrantFeatures?.length) {
    return (
      <div className="rounded-2xl border border-violet-500/35 bg-violet-500/10 p-4">
        <h3 className="text-sm font-semibold text-violet-100">{group.title}</h3>
        <p className="mt-1 text-xs text-slate-400">{group.hint}</p>
        <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
          {(group.autoGrant ?? []).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-violet-400" />
              {metaChoiceLabel(k)}
            </li>
          ))}
          {(group.autoGrantFeatures ?? []).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-violet-400" />
              {k === 'transcendentSoul' ? '超凡魂' : k}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onConfirm([])}
          className="mt-4 w-full rounded-lg bg-violet-500/25 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/35"
        >
          确认领取
        </button>
      </div>
    )
  }

  const ready = selected.length === group.pickCount

  return (
    <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4">
      <h3 className="text-sm font-semibold text-emerald-100">{group.title}</h3>
      <p className="mt-1 text-xs text-slate-400">
        {group.hint}（已选 {selected.length}/{group.pickCount}）
      </p>

      <div className="mt-4 space-y-2">
        {group.options.map((opt) => {
          const key = optionKey(opt)
          const picked = selected.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={[
                'w-full rounded-xl border p-3 text-left transition-all',
                picked
                  ? 'border-emerald-500/60 bg-emerald-500/15 ring-1 ring-emerald-500/40'
                  : 'border-white/10 bg-void-900/50 hover:border-emerald-500/30',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-100">{opt.label}</span>
                {picked && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{opt.description}</p>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          const opts = group.options.filter((o) => selected.includes(optionKey(o)))
          onConfirm(opts)
        }}
        className={[
          'mt-4 w-full rounded-lg py-2 text-sm font-semibold transition-colors',
          ready
            ? 'bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35'
            : 'cursor-not-allowed bg-white/5 text-slate-600',
        ].join(' ')}
      >
        确认选择
      </button>
    </div>
  )
}
