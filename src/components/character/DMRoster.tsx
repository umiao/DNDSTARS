import { Eye, EyeOff, Trash2, Minus, Plus, Heart } from 'lucide-react'
import { useCharacterStore } from '../../store/characters'

export default function DMRoster() {
  const characters = useCharacterStore((s) => s.characters)
  const update = useCharacterStore((s) => s.update)
  const remove = useCharacterStore((s) => s.remove)
  const select = useCharacterStore((s) => s.select)

  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        名册总览 · DM 快速控制
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-2 py-2 font-medium">角色</th>
              <th className="px-2 py-2 font-medium">职业/等级</th>
              <th className="px-2 py-2 font-medium">生命值</th>
              <th className="px-2 py-2 text-center font-medium">快速调整</th>
              <th className="px-2 py-2 text-center font-medium">对玩家可见</th>
              <th className="px-2 py-2 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => {
              const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100)) : 0
              const barColor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-rose-500'
              const clamp = (v: number) => Math.max(0, Math.min(c.maxHp + c.tempHp, v))
              return (
                <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-2 py-2.5">
                    <button onClick={() => select(c.id)} className="flex items-center gap-2 text-left">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-lg ${c.accent}`}>
                        {c.avatar}
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-100">{c.name}</span>
                        <span className="block text-xs text-slate-500">{c.player || '—'}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-slate-400">
                    {c.charClass} · {c.level}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-rose-400" />
                      <span className="w-14 tabular-nums text-slate-200">
                        {c.currentHp}/{c.maxHp}
                      </span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-void-900">
                        <span className={`block h-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => update(c.id, { currentHp: clamp(c.currentHp - 5) })}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs text-slate-500">5</span>
                      <button
                        onClick={() => update(c.id, { currentHp: clamp(c.currentHp + 5) })}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => update(c.id, { visibleToPlayers: !c.visibleToPlayers })}
                      className={c.visibleToPlayers ? 'text-emerald-300' : 'text-slate-600'}
                      title={c.visibleToPlayers ? '玩家可见' : '已对玩家隐藏'}
                    >
                      {c.visibleToPlayers ? <Eye className="mx-auto h-5 w-5" /> : <EyeOff className="mx-auto h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`确定删除「${c.name}」吗？`)) remove(c.id)
                      }}
                      className="text-slate-600 transition-colors hover:text-rose-400"
                      title="删除"
                    >
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
