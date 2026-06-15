/** 1–14 级可选职业（入门） */
export const STARTER_CLASS_NAMES = [
  '战士',
  '弓手',
  '法师',
  '牧师',
  '学者',
  '重炮手',
  '刺客',
  '魔术师',
] as const

/** 15–50 级可进阶选择的职业 */
export const ADVANCED_CLASS_NAMES = [
  '毁灭者',
  '龙吟剑客',
  '逐风者',
  '影舞者',
  '元素师',
  '魔导师',
  '光明导师',
  '圣骑士',
  '召唤师',
  '炼金师',
] as const

export type StarterClassName = (typeof STARTER_CLASS_NAMES)[number]
export type AdvancedClassName = (typeof ADVANCED_CLASS_NAMES)[number]

export interface CharacterClassDef {
  name: string
  /** 1–14 级可选 */
  starter: boolean
}

export const ALL_CHARACTER_CLASSES: CharacterClassDef[] = [
  ...STARTER_CLASS_NAMES.map((name) => ({ name, starter: true })),
  ...ADVANCED_CLASS_NAMES.map((name) => ({ name, starter: false })),
]

export const STARTER_MAX_LEVEL = 14
export const ADVANCED_MIN_LEVEL = 15
export const MAX_CHARACTER_LEVEL = 50

const ALL_NAMES = new Set(ALL_CHARACTER_CLASSES.map((c) => c.name))
const STARTER_SET = new Set<string>(STARTER_CLASS_NAMES)

export function isKnownClass(name: string): boolean {
  return ALL_NAMES.has(name)
}

export function isStarterClass(name: string): boolean {
  return STARTER_SET.has(name)
}

/** 该角色等级下可选的职业列表 */
export function classesForLevel(level: number, isDM = false): CharacterClassDef[] {
  if (isDM) return [...ALL_CHARACTER_CLASSES]
  if (level <= STARTER_MAX_LEVEL) {
    return ALL_CHARACTER_CLASSES.filter((c) => c.starter)
  }
  if (level >= ADVANCED_MIN_LEVEL && level <= MAX_CHARACTER_LEVEL) {
    return [...ALL_CHARACTER_CLASSES]
  }
  return ALL_CHARACTER_CLASSES.filter((c) => c.starter)
}

export function isClassAllowedAtLevel(charClass: string, level: number, isDM = false): boolean {
  if (isDM) return true
  if (level <= STARTER_MAX_LEVEL) return isStarterClass(charClass)
  if (level >= ADVANCED_MIN_LEVEL && level <= MAX_CHARACTER_LEVEL) return isKnownClass(charClass)
  return isStarterClass(charClass)
}

/** 施法/法术栏相关职业 */
const CASTER_PATTERN =
  /法师|元素师|魔导师|牧师|光明导师|圣骑士|学者|召唤师|炼金师|魔术师|术士|德鲁伊|邪术/

export function isCasterClass(charClass: string): boolean {
  return CASTER_PATTERN.test(charClass)
}

export function isShadowDancer(charClass: string): boolean {
  return charClass === '影舞者'
}
