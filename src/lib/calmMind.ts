import type { Character, CombatBuffs } from '../types/character'
import { findClassTrait } from './classFeatures'

/** 拥有「静心」特性 */
export function hasCalmMindFeature(c: Character): boolean {
  return !!findClassTrait(c, 'calmMind')
}

/** 处于气喘（剩余持续回合 > 0） */
export function isOutOfBreath(c: Character): boolean {
  return (c.combatBuffs?.outOfBreathTurns ?? 0) > 0
}

/** 处于静心（有特性且未气喘） */
export function isCalmMindActive(c: Character): boolean {
  return hasCalmMindFeature(c) && !!c.combatBuffs?.calmMind && !isOutOfBreath(c)
}

export function calmBreathState(c: Character): 'calm' | 'outOfBreath' | 'none' {
  if (isOutOfBreath(c)) return 'outOfBreath'
  if (isCalmMindActive(c)) return 'calm'
  return 'none'
}

/** 心如止水：保持静心时不再获得气喘 */
function immuneToOutOfBreathWhileCalm(c: Character): boolean {
  return (c.combatBuffs?.stillWaterBreathImmunityTurns ?? 0) > 0
}

/** 集中精神：被命中时可不打断静心（被动，暂不扣次数） */
function focusedSpiritOnHit(c: Character): boolean {
  return !!findClassTrait(c, 'focusedSpirit')
}

export function syncCalmMindFlags(buffs: CombatBuffs, hasTrait: boolean): CombatBuffs {
  if (!hasTrait) {
    return { ...buffs, calmMind: undefined, outOfBreathTurns: undefined }
  }
  const out = buffs.outOfBreathTurns ?? 0
  return {
    ...buffs,
    calmMind: out <= 0 && buffs.calmMind ? true : undefined,
    outOfBreathTurns: out > 0 ? out : undefined,
  }
}

/** 战斗开始时：仅波澜不惊默认进入静心；普通静心在回合开始时判定。 */
export function initCalmMindForCombat(c: Character): CombatBuffs {
  const buffs = { ...c.combatBuffs }
  if (!hasCalmMindFeature(c)) return buffs
  if (findClassTrait(c, 'swiftShot')) {
    return {
      ...buffs,
      calmMind: true,
      calmMindFirstTurnPending: undefined,
      outOfBreathTurns: undefined,
      movedFeetThisTurn: undefined,
      tookDamageThisTurn: undefined,
    }
  }
  return {
    ...buffs,
    calmMind: undefined,
    calmMindFirstTurnPending: undefined,
    outOfBreathTurns: undefined,
    movedFeetThisTurn: undefined,
    tookDamageThisTurn: undefined,
  }
}

export function beginCalmMindTurn(c: Character): CombatBuffs {
  const buffs = c.combatBuffs ?? {}
  if (!hasCalmMindFeature(c)) return buffs
  return syncCalmMindFlags(
    {
      ...buffs,
      calmMind: (buffs.outOfBreathTurns ?? 0) <= 0 ? true : undefined,
    },
    true,
  )
}

/** 受到攻击或消耗 AP 移动后失去静心并获得气喘，持续至下回合结束。 */
export function triggerOutOfBreath(c: Character, reason: 'damage' | 'move'): CombatBuffs {
  const buffs = c.combatBuffs ?? {}
  if (!hasCalmMindFeature(c)) return buffs

  if (reason === 'damage' && focusedSpiritOnHit(c)) return buffs
  if (immuneToOutOfBreathWhileCalm(c)) return buffs
  if ((buffs.calmSpiritStacks ?? 0) > 0) {
    const nextStacks = Math.max(0, (buffs.calmSpiritStacks ?? 0) - 1)
    return syncCalmMindFlags(
      {
        ...buffs,
        calmSpiritStacks: nextStacks > 0 ? nextStacks : undefined,
        outOfBreathTurns: undefined,
      },
      true,
    )
  }

  const next = Math.max(buffs.outOfBreathTurns ?? 0, 2)
  return syncCalmMindFlags({ ...buffs, calmMind: undefined, outOfBreathTurns: next }, true)
}

/** 回合结束时递减气喘计数 */
export function tickOutOfBreathOnEndTurn(c: Character): CombatBuffs {
  if (!hasCalmMindFeature(c)) return c.combatBuffs ?? {}
  const buffs = c.combatBuffs ?? {}
  const cur = buffs.outOfBreathTurns ?? 0
  const stillWaterBreathImmunityTurns =
    buffs.stillWaterBreathImmunityTurns && buffs.stillWaterBreathImmunityTurns > 0
      ? buffs.stillWaterBreathImmunityTurns - 1
      : undefined
  const withStillWaterTick = {
    ...buffs,
    stillWaterBreathImmunityTurns:
      stillWaterBreathImmunityTurns && stillWaterBreathImmunityTurns > 0
        ? stillWaterBreathImmunityTurns
        : undefined,
  }
  if (cur <= 0) return syncCalmMindFlags(withStillWaterTick, true)
  const next = cur - 1
  return syncCalmMindFlags(
    {
      ...withStillWaterTick,
      calmMind: next <= 0 ? undefined : buffs.calmMind,
      outOfBreathTurns: next > 0 ? next : undefined,
    },
    true,
  )
}
