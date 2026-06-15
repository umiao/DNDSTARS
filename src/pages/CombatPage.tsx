import { Swords, Play } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

export default function CombatPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="战斗"
        description="管理先攻顺序、回合、生命值与状态效果。"
        actions={
          <button className="glow-arcane flex items-center gap-2 rounded-xl bg-gradient-to-br from-arcane-500 to-arcane-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
            <Play className="h-4 w-4" />
            开始战斗
          </button>
        }
      />
      <EmptyState
        icon={Swords}
        title="当前没有战斗"
        description="把角色和敌人加入战斗，系统会自动排列先攻顺序并逐回合推进。"
        hint="阶段 3 将实现：先攻轨道 · 伤害/治疗 · 状态标记"
      />
    </div>
  )
}
