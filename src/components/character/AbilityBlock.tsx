import { abilityMod, formatMod, clampAbilityScore, MAX_ABILITY_SCORE } from '../../lib/dnd'

interface AbilityBlockProps {
  label: string
  score: number
  editable: boolean
  onChange: (score: number) => void
}

export default function AbilityBlock({ label, score, editable, onChange }: AbilityBlockProps) {
  const mod = abilityMod(score)
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-2 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="mt-1 text-3xl font-bold text-arcane-200">{formatMod(mod)}</span>
      {editable ? (
        <input
          type="number"
          min={1}
          max={MAX_ABILITY_SCORE}
          value={score}
          onChange={(e) => onChange(clampAbilityScore(Number(e.target.value) || 1))}
          className="mt-2 w-14 rounded-lg border border-white/10 bg-void-900/60 py-1 text-center text-sm font-semibold text-slate-200 outline-none focus:border-arcane-500"
        />
      ) : (
        <span className="mt-2 rounded-lg border border-white/10 bg-void-900/60 px-3 py-1 text-sm font-semibold text-slate-300">
          {score}
        </span>
      )}
    </div>
  )
}
