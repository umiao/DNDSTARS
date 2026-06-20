import type { Token } from '../store/maps'
import type { CharacterEquipment } from '../types/equipment'
import {
  applyAttackDefenseDamageModifier,
  computeAc,
  type AttackDefenseDamageAdjust,
  type CombatStatInput,
  type DamageReductionType,
  computeCritDamageMultiplier,
  computeDefense,
  computeMagicAttack,
  computeMagicDefense,
  computeMaxHp,
  computePhysicalAttack,
  formatCritDamagePercentFromInput,
  formatEquipmentStatLine,
  hasAnyEquipment,
} from './combatStats'
import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOTS } from './equipmentDefaults'
import { getEnemyStatBlock, type EnemyStatBlock } from './enemyStatBlocks'

export function enemyHasDerivedCombat(poolId?: string): boolean {
  if (!poolId) return false
  const block = getEnemyStatBlock(poolId)
  return !!block?.equipment && hasAnyEquipment(block.equipment)
}

export function enemyCombatInput(poolId: string): CombatStatInput | undefined {
  const block = getEnemyStatBlock(poolId)
  if (!block?.equipment || !hasAnyEquipment(block.equipment)) return undefined
  return {
    abilities: block.abilities,
    equipment: block.equipment,
    acFallback: block.ac,
  }
}

export function getEnemyAc(poolId: string): number {
  const input = enemyCombatInput(poolId)
  return input ? computeAc(input) : (getEnemyStatBlock(poolId)?.ac ?? 12)
}

export function getEnemyMaxHp(poolId: string, fallback = 12): number {
  const input = enemyCombatInput(poolId)
  if (input) return computeMaxHp(input)
  return fallback
}

export function getTokenTargetAc(token: Token): number | undefined {
  if (token.poolId && enemyHasDerivedCombat(token.poolId)) {
    return getEnemyAc(token.poolId)
  }
  return undefined
}

export function adjustDamageAgainstToken(
  baseDamage: number,
  attacker: CombatStatInput | undefined,
  token: Token,
  type: DamageReductionType = 'physical',
): AttackDefenseDamageAdjust {
  // [T4/C3] vulnerable applies even when there's no poolId/defender (e.g. plain tokens),
  // so route every branch through applyAttackDefenseDamageModifier with the flag.
  const vulnerable = (token.vulnerableTurns ?? 0) > 0
  const defender = token.poolId ? enemyCombatInput(token.poolId) : undefined
  return applyAttackDefenseDamageModifier(baseDamage, attacker, defender, type, vulnerable)
}

export interface EnemyDerivedCombatStats {
  ac: number
  physicalAttack: number
  defense: number
  magicAttack: number
  magicDefense: number
  maxHp: number
  critDamagePercent: string
  equipment: CharacterEquipment
}

export function getEnemyDerivedCombatStats(poolId: string): EnemyDerivedCombatStats | undefined {
  const input = enemyCombatInput(poolId)
  if (!input?.equipment) return undefined
  return {
    ac: computeAc(input),
    physicalAttack: computePhysicalAttack(input),
    defense: Math.round(computeDefense(input)),
    magicAttack: computeMagicAttack(input),
    magicDefense: Math.round(computeMagicDefense(input)),
    maxHp: computeMaxHp(input),
    critDamagePercent: formatCritDamagePercentFromInput(input),
    equipment: input.equipment,
  }
}

export function formatEnemyEquipmentList(equipment: CharacterEquipment): string {
  return EQUIPMENT_SLOTS.map((slot) => equipment[slot]?.name)
    .filter(Boolean)
    .join(' · ')
}

export function getEnemyEquipmentSlots(poolId: string): { slot: string; label: string; name?: string; stats: string }[] {
  const block = getEnemyStatBlock(poolId)
  if (!block?.equipment) return []
  return EQUIPMENT_SLOTS.map((slot) => {
    const item = block.equipment![slot]
    return {
      slot,
      label: EQUIPMENT_SLOT_LABELS[slot],
      name: item?.name,
      stats: item ? formatEquipmentStatLine(item) : '',
    }
  })
}

/** 敌人近战伤害：骰面 + 攻击力（同角色公式，无技能加值） */
export function resolveEnemyMeleeDamage(
  poolId: string,
  dice: { count: number; sides: number },
  opts: { isCrit?: boolean } = {},
): { values: number[]; total: number } | undefined {
  const input = enemyCombatInput(poolId)
  if (!input) return undefined
  const values = Array.from({ length: dice.count }, () => 1 + Math.floor(Math.random() * dice.sides))
  const diceSum = values.reduce((a, b) => a + b, 0)
  let total = diceSum
  if (opts.isCrit) {
    total = Math.floor(total * computeCritDamageMultiplier(input))
  }
  return { values, total }
}

export function enemyStatBlockUsesDerivedHp(block: EnemyStatBlock): boolean {
  return !!block.equipment && hasAnyEquipment(block.equipment)
}
