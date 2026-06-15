import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Swords, Bot, Sparkles, Settings, PanelLeftClose } from 'lucide-react'
import type { AppMode } from '../lib/appMode'

const navItems = [
  { to: '/', label: '战役总览', icon: LayoutDashboard, end: true },
  { to: '/maps', label: '战斗地图', icon: Swords },
  { to: '/characters', label: '角色', icon: Users },
  { to: '/ai', label: 'AI 敌人', icon: Bot },
]

const playerNavItems = navItems.filter((item) => item.to === '/maps' || item.to === '/characters')

export default function Sidebar({ onCollapse, mode }: { onCollapse?: () => void; mode?: AppMode }) {
  const items = mode === 'player' ? playerNavItems : navItems
  return (
    <aside className="glass flex w-64 shrink-0 flex-col border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="glow-arcane flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-arcane-500 to-arcane-600">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight text-gradient">星界</h1>
          <p className="text-xs text-slate-400">DND 跑团助手</p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="收起侧边栏"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-arcane-500/15 text-arcane-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-arcane-300' : 'text-slate-500 group-hover:text-slate-200',
                  ].join(' ')}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-slate-100">
          <Settings className="h-5 w-5 text-slate-500" />
          设置
        </button>
      </div>
    </aside>
  )
}
