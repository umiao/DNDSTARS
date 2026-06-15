import type { Token } from '../store/maps'
import { BURNING_ICON } from './burning'
import { IGNITE_DEFAULT_TURNS, IGNITE_ICON, IGNITE_STATUS_LABEL } from './ignite'
import { KNOCKBACK_DEFAULT_TURNS, KNOCKBACK_ICON, KNOCKBACK_STATUS_LABEL } from './knockback'
import { POISON_DEFAULT_TURNS, POISON_ICON } from './poison'
import { STUN_DEFAULT_TURNS, STUN_STATUS_LABEL } from './stun'

export const BURNING_STATUS_LABEL = '燃烧'
export const POISON_STATUS_LABEL = '中毒'

export type TokenStatusKey = 'knockback' | 'burning' | 'ignite' | 'poison' | 'stun'

export interface TokenStatusDef {
  key: TokenStatusKey
  label: string
  icon: string
  emoji: string
  tokenField: keyof Pick<
    Token,
    'knockbackTurns' | 'burningTurns' | 'igniteTurns' | 'poisonTurns' | 'stunTurns'
  >
  conditionLabel: string
  defaultTurns: number
}

export const TOKEN_STATUS_DEFS: TokenStatusDef[] = [
  {
    key: 'knockback',
    label: '击飞',
    icon: KNOCKBACK_ICON,
    emoji: '⬆',
    tokenField: 'knockbackTurns',
    conditionLabel: KNOCKBACK_STATUS_LABEL,
    defaultTurns: KNOCKBACK_DEFAULT_TURNS,
  },
  {
    key: 'burning',
    label: '燃烧',
    icon: BURNING_ICON,
    emoji: '🔥',
    tokenField: 'burningTurns',
    conditionLabel: BURNING_STATUS_LABEL,
    defaultTurns: 3,
  },
  {
    key: 'ignite',
    label: '点燃',
    icon: IGNITE_ICON,
    emoji: '🔥',
    tokenField: 'igniteTurns',
    conditionLabel: IGNITE_STATUS_LABEL,
    defaultTurns: IGNITE_DEFAULT_TURNS,
  },
  {
    key: 'poison',
    label: '中毒',
    icon: POISON_ICON,
    emoji: '☠️',
    tokenField: 'poisonTurns',
    conditionLabel: POISON_STATUS_LABEL,
    defaultTurns: POISON_DEFAULT_TURNS,
  },
  {
    key: 'stun',
    label: '眩晕',
    icon: '',
    emoji: '★',
    tokenField: 'stunTurns',
    conditionLabel: STUN_STATUS_LABEL,
    defaultTurns: STUN_DEFAULT_TURNS,
  },
]

export function getTokenStatusTurns(token: Token, key: TokenStatusKey): number {
  const def = TOKEN_STATUS_DEFS.find((d) => d.key === key)!
  return (token[def.tokenField] as number | undefined) ?? 0
}

export function buildTokenStatusPatch(
  key: TokenStatusKey,
  turns: number,
): Partial<Token> {
  const def = TOKEN_STATUS_DEFS.find((d) => d.key === key)!
  return { [def.tokenField]: turns > 0 ? turns : 0 }
}

export function syncCharacterCondition(
  conditions: string[],
  conditionLabel: string,
  active: boolean,
): string[] {
  const has = conditions.includes(conditionLabel)
  if (active && !has) return [...conditions, conditionLabel]
  if (!active && has) return conditions.filter((c) => c !== conditionLabel)
  return conditions
}
