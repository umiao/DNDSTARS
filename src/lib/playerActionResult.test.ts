import { describe, expect, it } from 'vitest'
import type { BattleMap } from '../store/maps'
import type { Character } from '../types/character'
import {
  capturePlayerActionResultBaseline,
  summarizePlayerActionResult,
  type PlayerActionResultBaseline,
} from './playerActionResult'

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
    currentAP: 2,
    passivePerception: 10,
    inspiration: 0,
    mana: 0,
    maxMana: 0,
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
    combatSkills: [
      {
        id: 'basic-shot',
        name: '基础射击',
        emoji: '',
        description: '',
        apCost: 1,
        cooldown: 0,
        cdReduction: 0,
        remaining: 0,
        usedThisTurn: false,
        damageCount: 1,
        damageSides: 8,
        damageBonus: 0,
        skillTreeId: 'basicShot',
      },
    ],
    conditions: [],
    notes: '',
    dmNotes: '',
    visibleToPlayers: true,
    qi: 3,
    ...patch,
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

function makeBaseline(character = makeCharacter(), map = makeMap()): PlayerActionResultBaseline {
  return capturePlayerActionResultBaseline({
    characters: [character],
    map,
    enemyApByToken: { goblin: { current: 2, max: 2 } },
  })
}

describe('player action result summary', () => {
  it('summarizes authoritative changes without mutating the baseline', () => {
    const before = makeBaseline()
    const afterCharacter = makeCharacter({
      currentHp: 12,
      tempHp: 1,
      currentAP: 1,
      qi: 2,
      conditions: ['眩晕'],
      traits: [{ ...makeCharacter().traits[0], uses: 1 }],
      combatSkills: [{ ...makeCharacter().combatSkills[0], remaining: 2 }],
    })
    const afterMap = makeMap()
    afterMap.tokens = afterMap.tokens.map((token) =>
      token.id === 'hero-token'
        ? { ...token, x: 150, y: 100, hp: 12, stunTurns: 1 }
        : token,
    )
    const after = capturePlayerActionResultBaseline({
      characters: [afterCharacter],
      map: afterMap,
      enemyApByToken: { goblin: { current: 1, max: 2 } },
    })

    const summary = summarizePlayerActionResult(
      { type: 'move-token', actorTokenId: 'hero-token', characterId: 'hero' },
      before,
      after,
    )

    expect(summary).toMatchObject({
      actionType: 'move-token',
      actorTokenId: 'hero-token',
      actorCharacterId: 'hero',
      changedEnemyAp: [{ tokenId: 'goblin', before: 2, after: 1, maxBefore: 2, maxAfter: 2 }],
    })
    expect(summary.changedCharacters[0]).toMatchObject({
      id: 'hero',
      hp: { before: 20, after: 12 },
      tempHp: { before: 0, after: 1 },
      ap: { before: 2, after: 1 },
      qi: { before: 3, after: 2 },
      conditions: { before: [], after: ['眩晕'] },
      traitUses: [{ name: '双箭', before: 2, after: 1 }],
      skillCooldowns: [{ skillId: 'basic-shot', before: 0, after: 2 }],
    })
    expect(summary.changedTokens[0]).toMatchObject({
      id: 'hero-token',
      hp: { before: 20, after: 12 },
      position: { before: { x: 50, y: 50 }, after: { x: 150, y: 100 } },
      statuses: { stunTurns: { after: 1 } },
    })
    expect(before.characters[0].currentHp).toBe(20)
    expect(before.map.tokens.find((token) => token.id === 'hero-token')?.x).toBe(50)
  })

  it('returns empty change lists when the authoritative state is unchanged', () => {
    const before = makeBaseline()
    const after = capturePlayerActionResultBaseline(before)

    const summary = summarizePlayerActionResult(
      { type: 'end-turn', actorTokenId: 'hero-token', characterId: 'hero' },
      before,
      after,
    )

    expect(summary.changedCharacters).toEqual([])
    expect(summary.changedTokens).toEqual([])
    expect(summary.changedEnemyAp).toEqual([])
  })
})
