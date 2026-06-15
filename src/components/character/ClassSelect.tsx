import {
  ADVANCED_CLASS_NAMES,
  ADVANCED_MIN_LEVEL,
  MAX_CHARACTER_LEVEL,
  classesForLevel,
  isKnownClass,
  STARTER_CLASS_NAMES,
  STARTER_MAX_LEVEL,
} from '../../lib/characterClasses'

const selectClassName =
  'w-full rounded-lg border border-white/10 bg-void-900/60 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-arcane-500'

interface ClassSelectProps {
  value: string
  level: number
  isDM?: boolean
  onChange: (charClass: string) => void
  className?: string
  id?: string
}

export default function ClassSelect({
  value,
  level,
  isDM = false,
  onChange,
  className = selectClassName,
  id,
}: ClassSelectProps) {
  if (isDM) {
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
        {!isKnownClass(value) && value ? <option value={value}>{value}（自定义）</option> : null}
        <optgroup label={`入门（1–${STARTER_MAX_LEVEL} 级）`}>
          {STARTER_CLASS_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </optgroup>
        <optgroup label={`进阶（${ADVANCED_MIN_LEVEL}–${MAX_CHARACTER_LEVEL} 级）`}>
          {ADVANCED_CLASS_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </optgroup>
      </select>
    )
  }

  const allowed = classesForLevel(level, false)
  const safeValue = allowed.some((c) => c.name === value) ? value : allowed[0]?.name ?? value

  if (level <= STARTER_MAX_LEVEL) {
    return (
      <select
        id={id}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        {allowed.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <select id={id} value={safeValue} onChange={(e) => onChange(e.target.value)} className={className}>
      <optgroup label="入门">
        {STARTER_CLASS_NAMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </optgroup>
      <optgroup label="进阶">
        {ADVANCED_CLASS_NAMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </optgroup>
    </select>
  )
}
