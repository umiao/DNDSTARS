import type { InitiativeEntry } from '../components/map/InitiativeTracker'
import type { Token } from '../store/maps'
import type { Character } from '../types/character'

/** 是否视为阵亡（优先用当前 HP 快照，与血条显示一致） */
export function isTokenDefeated(
  token: Token,
  characters: Character[],
  hp?: { hp: number; max: number; temp?: number },
): boolean {
  if (hp != null) return hp.hp <= 0
  return !isTokenAlive(token, characters)
}

export function isTokenAlive(token: Token, characters: Character[]): boolean {
  if (token.characterId) {
    const ch = characters.find((c) => c.id === token.characterId)
    if (ch) return ch.currentHp > 0
    if (token.maxHp != null) {
      return (token.hp ?? token.maxHp) > 0
    }
    return true
  }
  if (token.maxHp != null) {
    return (token.hp ?? token.maxHp) > 0
  }
  return true
}

/** 战斗阵营：玩家与 NPC 为友方，敌人为敌方 */
export function getTokenCombatSide(token: Token): 'ally' | 'enemy' | 'neutral' {
  if (token.type === 'obstacle') return 'neutral'
  return token.type === 'enemy' ? 'enemy' : 'ally'
}

export interface CombatOutcome {
  ended: true
  winner: 'ally' | 'enemy'
  message: string
}

/** 若某一阵营全员阵亡且该阵营在地图上有单位，则战斗结束 */
export function checkCombatOutcome(
  tokens: Token[],
  characters: Character[],
): CombatOutcome | { ended: false } {
  const allies = tokens.filter((t) => getTokenCombatSide(t) === 'ally')
  const enemies = tokens.filter((t) => getTokenCombatSide(t) === 'enemy')

  if (enemies.length > 0 && enemies.every((t) => !isTokenAlive(t, characters))) {
    return { ended: true, winner: 'ally', message: '所有敌人已被击败，战斗结束。' }
  }
  if (allies.length > 0 && allies.every((t) => !isTokenAlive(t, characters))) {
    return { ended: true, winner: 'enemy', message: '所有友方角色已阵亡，战斗结束。' }
  }
  return { ended: false }
}

/** @deprecated 战败 token 不再从地图移除，仅保留灰显 */
export function shouldRemoveTokenOnDefeat(_token: Token): boolean {
  return false
}

export function tokenHpAfterDamage(token: Token, amount: number, characters: Character[]): number {
  if (token.characterId) {
    const ch = characters.find((c) => c.id === token.characterId)
    if (ch) return Math.max(0, ch.currentHp - amount)
  }
  if (token.maxHp != null) {
    return Math.max(0, (token.hp ?? token.maxHp) - amount)
  }
  return 0
}

/** 从先攻列表移除 token，并返回新的先攻索引 */
export function pruneInitiativeForToken(
  order: InitiativeEntry[],
  currentIndex: number,
  tokenId: string,
): { order: InitiativeEntry[]; index: number } {
  const removeAt = order.findIndex((e) => e.tokenId === tokenId)
  if (removeAt < 0) return { order, index: currentIndex }
  const nextOrder = order.filter((e) => e.tokenId !== tokenId)
  if (nextOrder.length === 0) return { order: nextOrder, index: 0 }
  let index = currentIndex
  if (removeAt < index) index -= 1
  else if (removeAt === index) index = Math.min(index, nextOrder.length - 1)
  return { order: nextOrder, index: Math.max(0, index) }
}
