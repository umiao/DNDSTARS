import { describe, expect, it } from 'vitest'
import type { Character } from '../types/character'
import { createClassTrait } from './traitRegistry'
import { calmBreathState, initCalmMindForCombat, triggerOutOfBreath } from './calmMind'

function makeCharacter(patch: Partial<Character> = {}): Character {
  return {
    id: 'hero',
    name: 'Hero',
    player: '',
    avatar: '',
    accent: '',
    race: '',
    charClass: '逐风者',
    level: 30,
    background: '',
    experience: 0,
    reputation: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    skills: [],
    maxHp: 20,
    currentHp: 12,
    tempHp: 0,
    hitDice: '1d8',
    ac: 14,
    speed: 30,
    initiativeBonus: 0,
    saveDC: 12,
    actionPoints: 2,
    currentAP: 2,
    passivePerception: 10,
    inspiration: 0,
    mana: 0,
    maxMana: 0,
    traits: [],
    combatSkills: [],
    conditions: [],
    notes: '',
    dmNotes: '',
    visibleToPlayers: true,
    combatBuffs: {},
    ...patch,
  }
}

describe('calm mind and poised feature', () => {
  it('starts combat calm when the character has 波澜不惊', () => {
    const c = makeCharacter({
      traits: [createClassTrait('calmMind'), createClassTrait('swiftShot')],
    })

    expect(initCalmMindForCombat(c).calmMind).toBe(true)
  })

  it('does not start combat calm without 波澜不惊', () => {
    const c = makeCharacter({ traits: [createClassTrait('calmMind')] })

    expect(initCalmMindForCombat(c).calmMind).toBeUndefined()
  })

  it('switches from calm to out of breath when movement breaks calm', () => {
    const c = makeCharacter({
      traits: [createClassTrait('calmMind'), createClassTrait('swiftShot')],
      combatBuffs: { calmMind: true },
    })
    const nextBuffs = triggerOutOfBreath(c, 'move')

    expect(calmBreathState(c)).toBe('calm')
    expect(calmBreathState({ ...c, combatBuffs: nextBuffs })).toBe('outOfBreath')
  })
})
