import { describe, expect, it } from 'vitest'
import { getPlayerCharacter, playerViewCharacters } from './playerView'
import type { Character } from '../types/character'

function character(id: string, player: string, visibleToPlayers = true): Character {
  return {
    id,
    name: id,
    player,
    avatar: '🙂',
    accent: '',
    race: '',
    charClass: '弓手',
    level: 1,
    background: '',
    experience: 0,
    reputation: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    skills: [],
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDice: '1d8',
    ac: 10,
    speed: 30,
    initiativeBonus: 0,
    saveDC: 10,
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
    visibleToPlayers,
    combatBuffs: {},
  }
}

describe('player view assignment', () => {
  it('selects the character owned by the current player slot', () => {
    const characters = [
      character('c1', '玩家1'),
      character('c2', '玩家2'),
      character('c3', '玩家3'),
    ]

    expect(getPlayerCharacter(characters, { slot: 'player2' })?.id).toBe('c2')
    expect(playerViewCharacters(characters, { slot: 'player3' }).map((c) => c.id)).toEqual(['c3'])
  })

  it('uses explicit local assignment before owner aliases', () => {
    const characters = [
      character('c1', '玩家1'),
      character('c2', '玩家2'),
    ]

    expect(getPlayerCharacter(characters, { slot: 'player1', assignedCharacterId: 'c2' })?.id).toBe('c2')
  })

  it('does not let later player slots inherit the legacy player-one fallback', () => {
    const characters = [
      character('sample-adventurer', '玩家'),
      character('c2', '别人'),
    ]

    expect(getPlayerCharacter(characters, { slot: 'player2' })).toBeUndefined()
  })
})

