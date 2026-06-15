export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: 'str', label: '力量', full: 'Strength' },
  { key: 'dex', label: '敏捷', full: 'Dexterity' },
  { key: 'con', label: '体质', full: 'Constitution' },
  { key: 'int', label: '智力', full: 'Intelligence' },
  { key: 'wis', label: '感知', full: 'Wisdom' },
  { key: 'cha', label: '魅力', full: 'Charisma' },
]

export interface SkillDef {
  key: string
  label: string
  ability: AbilityKey
}

export const SKILLS: SkillDef[] = [
  { key: 'acrobatics', label: '杂技', ability: 'dex' },
  { key: 'animalHandling', label: '驯兽', ability: 'wis' },
  { key: 'arcana', label: '奥秘', ability: 'int' },
  { key: 'athletics', label: '运动', ability: 'str' },
  { key: 'deception', label: '欺瞒', ability: 'cha' },
  { key: 'history', label: '历史', ability: 'int' },
  { key: 'insight', label: '洞悉', ability: 'wis' },
  { key: 'intimidation', label: '威吓', ability: 'cha' },
  { key: 'investigation', label: '调查', ability: 'int' },
  { key: 'medicine', label: '医药', ability: 'wis' },
  { key: 'nature', label: '自然', ability: 'int' },
  { key: 'perception', label: '察觉', ability: 'wis' },
  { key: 'performance', label: '表演', ability: 'cha' },
  { key: 'persuasion', label: '游说', ability: 'cha' },
  { key: 'religion', label: '宗教', ability: 'int' },
  { key: 'sleightOfHand', label: '巧手', ability: 'dex' },
  { key: 'stealth', label: '隐匿', ability: 'dex' },
  { key: 'survival', label: '生存', ability: 'wis' },
]

export const MAX_ABILITY_SCORE = 100
export const ABILITY_BASELINE = 25

/**
 * 属性调整值（分段）：
 * 1–4 → -5，5–9 → -2，10–14 → -3，15–19 → -2，20–24 → -1，
 * 25–29 → 0，之后每 5 点 +1（30–34 → +1 … 100 → +15）
 */
export function abilityMod(score: number): number {
  const s = clampAbilityScore(score)
  if (s <= 4) return -5
  if (s <= 9) return -2
  if (s <= 14) return -3
  if (s <= 19) return -2
  if (s <= 24) return -1
  return Math.floor((s - ABILITY_BASELINE) / 5)
}

export function clampAbilityScore(score: number): number {
  return Math.max(1, Math.min(MAX_ABILITY_SCORE, score))
}

/** 熟练加值：基础 +2；11 级起每 10 级额外 +1 */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 10)
}

/** 把调整值格式化为带正负号的字符串，如 +3 / -1 */
export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}
