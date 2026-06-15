import type { ComponentType, ReactNode } from 'react'

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  hint?: string
  action?: ReactNode
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  action,
}: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
      <div className="glow-arcane mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-arcane-500/30 to-arcane-600/20">
        <Icon className="h-8 w-8 text-arcane-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>
      {hint && (
        <p className="mt-4 rounded-lg bg-ember-500/10 px-3 py-1.5 text-xs text-ember-400">
          {hint}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
