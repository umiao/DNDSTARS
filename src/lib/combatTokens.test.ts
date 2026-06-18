import { describe, expect, it } from 'vitest'
import type { Token } from '../store/maps'
import type { Character } from '../types/character'
import { checkCombatOutcome, isTokenAlive } from './combatTokens'

function token(patch: Partial<Token>): Token {
  return {
    id: 'token',
    label: 'Token',
    x: 0,
    y: 0,
    color: '#fff',
    emoji: '',
    size: 1,
    type: 'player',
    ...patch,
  }
}

describe('combat token liveness', () => {
  it('does not treat a linked token as defeated while its character is still syncing', () => {
    const linkedPlayer = token({ id: 'player-token', type: 'player', characterId: 'missing-character' })
    const enemy = token({ id: 'enemy-token', type: 'enemy', hp: 12, maxHp: 12 })

    expect(isTokenAlive(linkedPlayer, [])).toBe(true)
    expect(checkCombatOutcome([linkedPlayer, enemy], [])).toEqual({ ended: false })
  })

  it('still treats a linked token as defeated when the synced character is at 0 HP', () => {
    const linkedPlayer = token({ id: 'player-token', type: 'player', characterId: 'hero' })
    const enemy = token({ id: 'enemy-token', type: 'enemy', hp: 12, maxHp: 12 })
    const hero = { id: 'hero', currentHp: 0 } as Character

    expect(isTokenAlive(linkedPlayer, [hero])).toBe(false)
    expect(checkCombatOutcome([linkedPlayer, enemy], [hero]).ended).toBe(true)
  })
})
