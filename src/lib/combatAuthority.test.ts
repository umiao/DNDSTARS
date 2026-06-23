import { describe, expect, it } from 'vitest'
import type { Character } from '../types/character'
import {
  activateFeatureAuthority,
  attackCharacterAuthority,
  executeCombatMutationsAuthority,
  moveCharacterAuthority,
  resolveDodgeAuthority,
  spendEnemyApAuthority,
  startCombatAuthority,
  type CombatMutationAuthorityState,
  type CombatAuthorityState,
} from './combatAuthority'
import type { BattleMap } from '../store/maps'
import type { CombatMutation } from './combatResolutionPipeline'

function makeCharacter(patch: Partial<Character> = {}): Character {
  return {
    id: 'hero',
    name: 'Hero',
    player: '',
    avatar: '',
    accent: '',
    race: '',
    charClass: '',
    level: 1,
    background: '',
    experience: 0,
    reputation: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    skills: [],
    maxHp: 20,
    currentHp: 20,
    tempHp: 0,
    hitDice: '1d8',
    ac: 14,
    speed: 30,
    initiativeBonus: 0,
    saveDC: 12,
    actionPoints: 2,
    currentAP: 0,
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
    ...patch,
  }
}

function makeState(character: Character = makeCharacter()): CombatAuthorityState {
  return {
    characters: [character],
    enemyApByToken: {
      goblin: { current: 0, max: 2 },
    },
  }
}

function makeMap(): BattleMap {
  return {
    id: 'map',
    name: 'Map',
    width: 500,
    height: 500,
    gridSize: 50,
    gridOffsetX: 0,
    gridOffsetY: 0,
    showGrid: true,
    tokens: [
      {
        id: 'hero-token',
        label: 'Hero',
        x: 50,
        y: 50,
        color: '#22c55e',
        emoji: '🙂',
        size: 1,
        type: 'player',
        characterId: 'hero',
        hp: 20,
        maxHp: 20,
      },
      {
        id: 'goblin',
        label: 'Goblin',
        x: 100,
        y: 50,
        color: '#ef4444',
        emoji: '😡',
        size: 1,
        type: 'enemy',
        hp: 12,
        maxHp: 12,
      },
    ],
  }
}

function makeMutationState(character: Character = makeCharacter()): CombatMutationAuthorityState {
  return {
    ...makeState(character),
    map: makeMap(),
  }
}

describe('combat authority', () => {
  it('starts combat from the DM side and initializes character and enemy AP', () => {
    const result = startCombatAuthority(makeState(), { role: 'dm', enemyTokenIds: ['goblin'] })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.characters[0].currentAP).toBe(2)
    expect(result.state.enemyApByToken.goblin).toEqual({ current: 2, max: 2 })
  })

  it('does not allow the player side to initialize combat AP', () => {
    const state = makeState()
    const result = startCombatAuthority(state, { role: 'player', enemyTokenIds: ['goblin'] })

    expect(result.ok).toBe(false)
    expect(result.state).toBe(state)
    expect(result.state.characters[0].currentAP).toBe(0)
  })

  it('spends 1 AP when the DM activates a feature', () => {
    const result = activateFeatureAuthority(makeState(makeCharacter({ currentAP: 2 })), {
      role: 'dm',
      characterId: 'hero',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({ before: 2, after: 1, amount: 1 })
    expect(result.state.characters[0].currentAP).toBe(1)
  })

  it('spends 1 AP when the DM accepts a character move', () => {
    const result = moveCharacterAuthority(makeState(makeCharacter({ currentAP: 2 })), {
      role: 'dm',
      characterId: 'hero',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.characters[0].currentAP).toBe(1)
  })

  it('spends 1 AP when the DM accepts a character attack', () => {
    const result = attackCharacterAuthority(makeState(makeCharacter({ currentAP: 2 })), {
      role: 'dm',
      characterId: 'hero',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.characters[0].currentAP).toBe(1)
  })

  it('spends enemy AP on the DM side for monster attacks', () => {
    const result = spendEnemyApAuthority(makeState(), {
      role: 'dm',
      tokenId: 'goblin',
      amount: 1,
    })

    expect(result.ok).toBe(false)

    const ready = makeState()
    ready.enemyApByToken.goblin.current = 2
    const spent = spendEnemyApAuthority(ready, {
      role: 'dm',
      tokenId: 'goblin',
      amount: 1,
    })

    expect(spent.ok).toBe(true)
    if (!spent.ok) return
    expect(spent.state.enemyApByToken.goblin.current).toBe(1)
  })

  it('resolves a successful dodge without damage while spending dodge AP', () => {
    const result = resolveDodgeAuthority(makeState(makeCharacter({ currentAP: 2, ac: 14 })), {
      role: 'dm',
      targetCharacterId: 'hero',
      wantsDodge: true,
      d20: 8,
      attackBonus: 5,
      damage: 10,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      dodgeApSpent: true,
      dodged: true,
      attackTotal: 13,
      damageApplied: 0,
    })
    expect(result.state.characters[0]).toMatchObject({ currentAP: 1, currentHp: 20 })
  })

  it('resolves a failed dodge by applying damage on the DM side', () => {
    const result = resolveDodgeAuthority(makeState(makeCharacter({ currentAP: 2, ac: 14 })), {
      role: 'dm',
      targetCharacterId: 'hero',
      wantsDodge: true,
      d20: 9,
      attackBonus: 5,
      damage: 10,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      dodgeApSpent: true,
      dodged: false,
      attackTotal: 14,
      damageApplied: 10,
    })
    expect(result.state.characters[0]).toMatchObject({ currentAP: 1, currentHp: 10 })
  })

  it('keeps player-side dodge answers from mutating authoritative HP or AP', () => {
    const state = makeState(makeCharacter({ currentAP: 2, currentHp: 20 }))
    const result = resolveDodgeAuthority(state, {
      role: 'player',
      targetCharacterId: 'hero',
      wantsDodge: true,
      d20: 20,
      attackBonus: 5,
      damage: 10,
    })

    expect(result.ok).toBe(false)
    expect(result.state).toBe(state)
    expect(state.characters[0]).toMatchObject({ currentAP: 2, currentHp: 20 })
  })

  it('executes combat mutations on the DM side in one authoritative pass', () => {
    const state = makeMutationState(
      makeCharacter({
        currentAP: 2,
        currentHp: 10,
        maxHp: 20,
        tempHp: 3,
        traits: [
          {
            id: 'trait-double-arrow',
            name: '双箭',
            level: 1,
            uses: 2,
            maxUses: 2,
            description: '',
            featureKey: 'doubleArrow',
          },
        ],
      }),
    )
    const mutations: CombatMutation[] = [
      { type: 'spend-ap', characterId: 'hero', amount: 1, reason: 'attack' },
      { type: 'spend-feature-use', characterId: 'hero', featureKey: 'doubleArrow', reason: 'used' },
      {
        type: 'damage',
        packet: {
          id: 'damage-1',
          source: { tokenId: 'goblin' },
          target: { tokenId: 'hero-token', characterId: 'hero' },
          amount: 5,
        },
      },
      { type: 'heal', characterId: 'hero', amount: 2, reason: 'test heal' },
      {
        type: 'condition',
        target: { tokenId: 'hero-token', characterId: 'hero' },
        condition: '眩晕',
        mode: 'add',
        turns: 1,
        reason: 'test stun',
      },
      { type: 'log', text: 'mutation log', kind: 'turn' },
      { type: 'custom', key: 'debug', payload: { ok: true } },
    ]

    const result = executeCombatMutationsAuthority(state, { role: 'dm', mutations })

    expect(result.failures).toEqual([])
    expect(result.logs).toHaveLength(1)
    expect(result.custom).toHaveLength(1)
    expect(result.state.characters[0]).toMatchObject({
      currentAP: 1,
      currentHp: 10,
      tempHp: 0,
      conditions: ['眩晕'],
    })
    expect(result.state.characters[0].traits[0].uses).toBe(1)
    expect(result.state.map.tokens.find((token) => token.id === 'hero-token')).toMatchObject({
      hp: 10,
      maxHp: 20,
      stunTurns: 1,
    })
    expect(state.characters[0]).toMatchObject({ currentAP: 2, currentHp: 10, tempHp: 3 })
    expect(state.map.tokens.find((token) => token.id === 'hero-token')).toMatchObject({ hp: 20 })
  })

  it('rejects combat mutations from the player side without changing state', () => {
    const state = makeMutationState(makeCharacter({ currentAP: 2 }))
    const result = executeCombatMutationsAuthority(state, {
      role: 'player',
      mutations: [{ type: 'spend-ap', characterId: 'hero', amount: 1, reason: 'player-side attempt' }],
    })

    expect(result.failures).toHaveLength(1)
    expect(result.failures[0].reason).toBe('not-authority')
    expect(result.state).toBe(state)
    expect(state.characters[0].currentAP).toBe(2)
  })
})
