import { useCharacterStore } from '../../store/characters'
import SkillBar from '../character/SkillBar'
import type { CombatSkill } from '../../types/character'

import { isCasterClass } from '../../lib/characterClasses'

function isSpellLikeSkill(skill: CombatSkill): boolean {
  return /术|飞弹|护盾|传送|火球|毒云|奥术|星界|烟雾/.test(skill.name)
}

interface MapSpellsPanelProps {
  charId: string
  onUseSkill?: (skill: CombatSkill) => void
  onQiReduceSkill?: (skill: CombatSkill) => void
  canAct?: boolean
}

/** 地图战斗 · 法术栏（施法职业显示法术型技能） */
export default function MapSpellsPanel({ charId, onUseSkill, onQiReduceSkill, canAct = true }: MapSpellsPanelProps) {
  const c = useCharacterStore((s) => s.characters.find((x) => x.id === charId))

  if (!c) return null

  const isCaster = isCasterClass(c.charClass)
  const spellSkills = c.combatSkills.filter(isSpellLikeSkill)

  if (!isCaster && spellSkills.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">该职业无法术栏；弓手、战士等请使用技能栏。</p>
    )
  }

  if (spellSkills.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">暂无已登记的法术技能。</p>
    )
  }

  return (
    <SkillBar
      charId={charId}
      hideTurnControls
      scrollColumns
      fillHeight
      onUseSkill={onUseSkill}
      onQiReduceSkill={onQiReduceSkill}
      canAct={canAct}
    />
  )
}
