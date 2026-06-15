import { BookOpen } from 'lucide-react'
import {
  ADVANCED_CLASS_NAMES,
  ALL_CHARACTER_CLASSES,
  ADVANCED_MIN_LEVEL,
  MAX_CHARACTER_LEVEL,
  STARTER_CLASS_NAMES,
  STARTER_MAX_LEVEL,
} from '../../lib/characterClasses'

/** DM 后台：职业一览 */
export default function ClassCatalog() {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <BookOpen className="h-3.5 w-3.5 text-arcane-300" />
        职业配置 · 共 {ALL_CHARACTER_CLASSES.length} 个
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
          <p className="text-sm font-semibold text-sky-200">
            入门职业（1–{STARTER_MAX_LEVEL} 级可选）
          </p>
          <p className="mt-2 flex flex-wrap gap-1.5">
            {STARTER_CLASS_NAMES.map((name) => (
              <span
                key={name}
                className="rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-100"
              >
                {name}
              </span>
            ))}
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-sm font-semibold text-violet-200">
            进阶职业（{ADVANCED_MIN_LEVEL}–{MAX_CHARACTER_LEVEL} 级）
          </p>
          <p className="mt-2 flex flex-wrap gap-1.5">
            {ADVANCED_CLASS_NAMES.map((name) => (
              <span
                key={name}
                className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-100"
              >
                {name}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  )
}
