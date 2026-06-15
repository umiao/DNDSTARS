import type { CharacterEquipment, EquipmentItem, EquipmentSlot } from '../types/equipment'

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'mainWeapon',
  'offHand',
  'armor',
  'helmet',
  'shoes',
  'ring',
  'necklace',
]

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  mainWeapon: '主武器',
  offHand: '副手武器',
  armor: '护甲',
  helmet: '头盔',
  shoes: '鞋',
  ring: '戒指',
  necklace: '项链',
}

export const LONG_BOW: EquipmentItem = {
  id: 'long-bow',
  name: '长弓',
  slot: 'mainWeapon',
  physicalAttack: 4,
  magicAttack: 2,
}

export const SCIMITAR: EquipmentItem = {
  id: 'scimitar',
  name: '弯刀',
  slot: 'offHand',
  physicalAttack: 5,
  magicAttack: 1,
}

export const GOBLIN_SHORTBOW: EquipmentItem = {
  id: 'goblin-shortbow',
  name: '哥布林短弓',
  slot: 'mainWeapon',
  physicalAttack: 4,
}

export const HOBGOBLIN_LONGSWORD: EquipmentItem = {
  id: 'hobgoblin-longsword',
  name: '大地精长剑',
  slot: 'mainWeapon',
  physicalAttack: 6,
}

export const LEATHER_ARMOR: EquipmentItem = {
  id: 'leather-armor',
  name: '皮甲',
  slot: 'armor',
  ac: 14,
  defense: 4,
  magicDefense: 2,
}

export const GOBLIN_LEATHER_ARMOR: EquipmentItem = {
  id: 'goblin-leather-armor',
  name: '哥布林皮甲',
  slot: 'armor',
  ac: 14,
  defense: 2,
  magicDefense: 1,
}

export const HOBGOBLIN_CHAIN_ARMOR: EquipmentItem = {
  id: 'hobgoblin-chain-armor',
  name: '大地精链甲与盾',
  slot: 'armor',
  ac: 18,
  defense: 10,
  magicDefense: 3,
}

export const LEATHER_CAP: EquipmentItem = {
  id: 'leather-cap',
  name: '皮帽',
  slot: 'helmet',
  hpBonus: 4,
}

export const GOBLIN_TOUGHNESS: EquipmentItem = {
  id: 'goblin-toughness',
  name: '哥布林韧性',
  slot: 'helmet',
  hpBonus: 6,
}

export const HOBGOBLIN_DISCIPLINE: EquipmentItem = {
  id: 'hobgoblin-discipline',
  name: '大地精军纪',
  slot: 'helmet',
  hpBonus: 15,
}

export const CRIT_RING: EquipmentItem = {
  id: 'crit-ring',
  name: '暴击戒指',
  slot: 'ring',
  critDamagePercent: 2,
}

export const DEFAULT_ARCHER_EQUIPMENT: CharacterEquipment = {
  mainWeapon: LONG_BOW,
  armor: LEATHER_ARMOR,
  helmet: LEATHER_CAP,
  ring: CRIT_RING,
}

/** 哥布林默认装备 */
export const GOBLIN_EQUIPMENT: CharacterEquipment = {
  mainWeapon: GOBLIN_SHORTBOW,
  offHand: SCIMITAR,
  armor: GOBLIN_LEATHER_ARMOR,
  helmet: GOBLIN_TOUGHNESS,
}

/** 大地精默认装备 */
export const HOBGOBLIN_EQUIPMENT: CharacterEquipment = {
  mainWeapon: HOBGOBLIN_LONGSWORD,
  armor: HOBGOBLIN_CHAIN_ARMOR,
  helmet: HOBGOBLIN_DISCIPLINE,
}

/** 可选装备目录（角色页换装） */
export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  LONG_BOW,
  LEATHER_ARMOR,
  LEATHER_CAP,
  CRIT_RING,
]

export function catalogForSlot(slot: EquipmentSlot): EquipmentItem[] {
  return EQUIPMENT_CATALOG.filter((item) => item.slot === slot)
}
