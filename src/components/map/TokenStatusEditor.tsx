import { useState } from 'react'
import { ChevronUp, Minus, Plus, Sparkles } from 'lucide-react'
import type { Token } from '../../store/maps'
import ProcessedIcon from '../ProcessedIcon'
import {
  buildTokenStatusPatch,
  getTokenStatusTurns,
  TOKEN_STATUS_DEFS,
  type TokenStatusKey,
} from '../../lib/tokenStatus'
import { useCharacterStore } from '../../store/characters'

interface TokenStatusEditorProps {
  mapId: string
  token: Token
  updateToken: (mapId: string, tokenId: string, patch: Partial<Token>) => void
}

export default function TokenStatusEditor({ mapId, token, updateToken }: TokenStatusEditorProps) {
  const updateChar = useCharacterStore((s) => s.update)
  const [open, setOpen] = useState(false)

  const applyStatus = (key: TokenStatusKey, turns: number) => {
    const def = TOKEN_STATUS_DEFS.find((d) => d.key === key)!
    const nextTurns = Math.max(0, turns)
    updateToken(mapId, token.id, buildTokenStatusPatch(key, nextTurns))

    if (token.characterId) {
      const ch = useCharacterStore.getState().characters.find((c) => c.id === token.characterId)
      if (ch) {
        const conditions = [...ch.conditions]
        const active = nextTurns > 0
        const has = conditions.includes(def.conditionLabel)
        if (active && !has) conditions.push(def.conditionLabel)
        if (!active && has) {
          const idx = conditions.indexOf(def.conditionLabel)
          if (idx >= 0) conditions.splice(idx, 1)
        }
        if (conditions.length !== ch.conditions.length) {
          updateChar(token.characterId, { conditions })
        }
      }
    }
  }

  const activeCount = TOKEN_STATUS_DEFS.filter((def) => getTokenStatusTurns(token, def.key) > 0).length

  const statusIcon = (def: (typeof TOKEN_STATUS_DEFS)[number], className = 'h-3.5 w-3.5 object-contain') => {
    if (def.key === 'knockback') {
      return <ProcessedIcon knockback src={def.icon} className={className} fallback="⬆" />
    }
    if (def.key === 'burning') {
      return <ProcessedIcon burning src={def.icon} className={className} fallback="🔥" />
    }
    if (def.key === 'ignite') {
      return <ProcessedIcon ignite src={def.icon} className={className} fallback="🔥" />
    }
    if (def.key === 'poison') {
      return <ProcessedIcon poison src={def.icon} className={className} fallback="☠️" />
    }
    return <span className="text-xs leading-none">{def.emoji}</span>
  }

  return (
    <div className="relative shrink-0">
      {open && (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[min(92vw,28rem)] rounded-xl border border-white/10 bg-void-950/95 p-2 shadow-2xl backdrop-blur-md">
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-medium text-slate-400">
            <Sparkles className="h-3 w-3 text-arcane-300" />
            添加状态
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {TOKEN_STATUS_DEFS.map((def) => {
              const turns = getTokenStatusTurns(token, def.key)
              const active = turns > 0
              return (
                <div
                  key={def.key}
                  className={[
                    'flex items-center gap-0.5 rounded-md border px-1 py-0.5',
                    active ? 'border-white/20 bg-white/8' : 'border-white/8 bg-white/3',
                  ].join(' ')}
                  title={`${def.label}：点击 + 添加，- 移除`}
                >
                  <button
                    type="button"
                    onClick={() => applyStatus(def.key, active ? 0 : def.defaultTurns)}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:bg-white/10"
                    title={active ? `移除${def.label}` : `添加${def.label}`}
                  >
                    {statusIcon(def)}
                  </button>
                  {active ? (
                    <>
                      <button
                        type="button"
                        onClick={() => applyStatus(def.key, Math.max(1, turns - 1))}
                        className="flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:bg-white/10"
                        title="减少回合"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={turns}
                        onChange={(e) => applyStatus(def.key, Math.max(1, Number(e.target.value) || 1))}
                        className="w-7 rounded border border-white/10 bg-void-950/80 px-0.5 text-center text-[10px] text-slate-200 outline-none focus:border-arcane-500"
                        title={`${def.label}剩余回合`}
                      />
                      <button
                        type="button"
                        onClick={() => applyStatus(def.key, turns + 1)}
                        className="flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:bg-white/10"
                        title="增加回合"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => applyStatus(def.key, def.defaultTurns)}
                      className="flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:bg-white/10"
                      title={`添加${def.label}`}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex h-7 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors',
          open
            ? 'border-arcane-400/45 bg-arcane-500/20 text-arcane-100'
            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
        ].join(' ')}
        title="上拉添加或调整状态"
      >
        <Sparkles className="h-3.5 w-3.5" />
        状态
        {activeCount > 0 && (
          <span className="rounded-full bg-arcane-400/25 px-1.5 text-[10px] text-arcane-100">
            {activeCount}
          </span>
        )}
        <ChevronUp className={['h-3.5 w-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} />
      </button>
    </div>
  )
}
