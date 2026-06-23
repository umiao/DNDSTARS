import { describe, expect, it } from 'vitest'
import type { BattleMap, Token } from '../store/maps'
import type { Character } from '../types/character'
import {
  attackDamageDiceCount,
  doubleArrowExtraDamageSides,
  findTokenBehindTarget,
  resolveDexSaveDamage,
  resolveRangedAttackRoll,
} from './archerCombat'
import {
  ARCHER_SKILL_TREE,
  BASIC_SHOT_DEF,
  buildSkillDescription,
  skillGrantsKnockback,
  skillGrantsStun,
  skillKnockbackSaveDisadvantage,
  skillToCombatSkill,
  type ArcherSkillDef,
} from './archerSkillTree'
import { canUseArmorPiercing, canUseDoubleArrow, createClassTrait } from './classFeatures'
import { executeCombatMutationsAuthority, type CombatMutationAuthorityState } from './combatAuthority'
import type { CombatMutation } from './combatResolutionPipeline'
import {
  applyAttackDefenseDamageModifier,
  characterToCombatInput,
  computePhysicalAttack,
} from './combatStats'
import { cellToPixel, type GridCell } from './gridCombat'
import { canPlaceAoe, cellsForAoe, getSkillAoeTargeting, tokensInCells } from './skillTargeting'
import { STUN_STATUS_LABEL } from './stun'
import {
  CLASS_FEATURE_DEFS,
  type ClassFeatureKey,
} from './traitRegistry'

function makeCharacter(patch: Partial<Character> = {}): Character {
  return {
    id: 'hero',
    name: 'Hero',
    player: '',
    avatar: '',
    accent: '',
    race: '',
    charClass: 'Archer',
    level: 21,
    background: '',
    experience: 0,
    reputation: 0,
    abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    skills: [],
    maxHp: 40,
    currentHp: 40,
    tempHp: 0,
    hitDice: '1d8',
    ac: 14,
    speed: 30,
    initiativeBonus: 0,
    saveDC: 12,
    actionPoints: 2,
    currentAP: 4,
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
    qi: 9,
    ...patch,
  }
}

function makeMap(tokens: Token[] = []): BattleMap {
  return {
    id: 'map',
    name: 'Map',
    width: 1000,
    height: 1000,
    gridSize: 50,
    gridOffsetX: 0,
    gridOffsetY: 0,
    showGrid: true,
    feetPerCell: 5,
    tokens,
  }
}

function tokenAt(id: string, type: Token['type'], cell: GridCell, patch: Partial<Token> = {}): Token {
  const map = makeMap()
  const pos = cellToPixel(cell, map)
  return {
    id,
    label: id,
    x: pos.x,
    y: pos.y,
    color: type === 'enemy' ? '#ef4444' : '#22c55e',
    emoji: '',
    size: 1,
    type,
    ...patch,
  }
}

function makeAuthorityState(character: Character, map: BattleMap): CombatMutationAuthorityState {
  return {
    characters: [character],
    enemyApByToken: {},
    map,
  }
}

function allSkillDefs(): ArcherSkillDef[] {
  return [BASIC_SHOT_DEF, ...ARCHER_SKILL_TREE]
}

function skillCaseName(def: ArcherSkillDef, rank: number): string {
  return `${def.id} rank ${rank}`
}

describe('archer skill combat contracts', () => {
  const skillCases = allSkillDefs().flatMap((def) => {
    const ranks = new Set([1, def.tiers.length])
    return [...ranks].map((rank) => [def, rank] as const)
  })

  it.each(skillCases)('can trigger %s with fixed dice and DM-owned AP/damage', (def, rank) => {
    const skill = skillToCombatSkill(def, rank)
    const heroToken = tokenAt('hero-token', 'player', { col: 1, row: 1 }, { characterId: 'hero', hp: 40, maxHp: 40 })
    const enemyToken = tokenAt('enemy-token', 'enemy', { col: 3, row: 1 }, { hp: 100, maxHp: 100 })
    const map = makeMap([heroToken, enemyToken])
    const caster = makeCharacter({ combatSkills: [skill], currentAP: 4 })
    const diceCount = attackDamageDiceCount(skill, false)
    const damageValues = Array.from({ length: diceCount }, () => 1)

    const attack = resolveRangedAttackRoll(caster, skill, 0, false, {
      d20: 10,
      damageValues,
    })
    const mutations: CombatMutation[] = [
      { type: 'spend-ap', characterId: caster.id, amount: skill.apCost, reason: skillCaseName(def, rank) },
      {
        type: 'damage',
        packet: {
          id: `${def.id}-${rank}-damage`,
          source: { tokenId: heroToken.id, characterId: caster.id },
          target: { tokenId: enemyToken.id },
          amount: attack.damageTotal,
          roll: {
            values: damageValues,
            sides: skill.damageSides,
            bonus: skill.damageBonus,
            total: attack.damageTotal,
            label: skillCaseName(def, rank),
          },
        },
      },
    ]

    const result = executeCombatMutationsAuthority(makeAuthorityState(caster, map), {
      role: 'dm',
      mutations,
    })

    expect(result.failures).toEqual([])
    expect(result.state.characters[0].currentAP).toBe(4 - skill.apCost)
    expect(result.state.map.tokens.find((token) => token.id === enemyToken.id)?.hp).toBe(100 - attack.damageTotal)
  })

  it('keeps multi-arrow skills as one damage contract with multiplied dice, not duplicated rolls', () => {
    const multiShot = skillToCombatSkill(ARCHER_SKILL_TREE.find((def) => def.id === 'multiShot')!, 1)
    const encircle = skillToCombatSkill(ARCHER_SKILL_TREE.find((def) => def.id === 'encircle')!, 1)

    expect(attackDamageDiceCount(multiShot, false)).toBe(2)
    expect(attackDamageDiceCount(encircle, false)).toBe(6)
  })

  it('uses the revised multi shot tier table and same-target wording', () => {
    const def = ARCHER_SKILL_TREE.find((item) => item.id === 'multiShot')!

    expect(def.cooldown).toBe(2)
    expect(def.tiers.map((tier) => [tier.damageCount, tier.damageSides, tier.arrowShots, tier.apCost ?? def.apCost])).toEqual([
      [1, 4, 2, 1],
      [2, 4, 2, 1],
      [3, 4, 2, 1],
      [3, 4, 3, 1],
      [4, 4, 3, 1],
    ])
    expect(buildSkillDescription(def, 2)).toBe(
      '多重射击 CD 2回合，\n对30尺范围内一名敌军射出两只箭矢\n每支箭造成2D4点无属性伤害。',
    )
    expect(buildSkillDescription(def, 5)).toBe(
      '多重射击 CD 2回合，\n对30尺范围内一名敌军射出三只箭矢\n每支箭造成4D4点无属性伤害。',
    )
  })

  it('forces precise strike to hit and crit from the supplied d20', () => {
    const skill = skillToCombatSkill(BASIC_SHOT_DEF, 1)
    const caster = makeCharacter({ combatSkills: [skill] })

    const attack = resolveRangedAttackRoll(caster, skill, 99, false, {
      d20: 1,
      damageValues: [4],
      forceCrit: true,
    })

    expect(attack.hit).toBe(true)
    expect(attack.isCrit).toBe(true)
    expect(attack.damageTotal).toBeGreaterThan(4)
  })

  it('uses the explicit save d20 for dex-save half damage', () => {
    const target = makeCharacter({ abilities: { str: 10, dex: 25, con: 10, int: 10, wis: 10, cha: 10 } })

    expect(resolveDexSaveDamage(target, 11, 12, 12)).toMatchObject({
      saveD20: 12,
      success: true,
      damage: 5,
    })
    expect(resolveDexSaveDamage(target, 11, 12, 11)).toMatchObject({
      saveD20: 11,
      success: false,
      damage: 11,
    })
  })

  it('keeps rank-gated knockback and stun effects explicit', () => {
    expect(skillGrantsKnockback('whirlwindKick', 1)).toBe(true)
    expect(skillGrantsStun('burstKick', 2)).toBe(false)
    expect(skillGrantsStun('burstKick', 3)).toBe(true)
    expect(skillGrantsStun('focusShot', 3)).toBe(false)
    expect(skillGrantsStun('focusShot', 4)).toBe(true)
    expect(skillKnockbackSaveDisadvantage('eagleStrike', 4)).toBe(false)
    expect(skillKnockbackSaveDisadvantage('eagleStrike', 5)).toBe(true)
  })
})

describe('archer skill targeting contracts', () => {
  const aoeCases: Array<{
    skillId: string
    caster: GridCell
    anchor: GridCell
    expected: string[]
    rejected: string[]
    tokens: Token[]
  }> = [
    {
      skillId: 'whirlwindKick',
      caster: { col: 4, row: 4 },
      anchor: { col: 8, row: 8 },
      expected: ['near'],
      rejected: ['far'],
      tokens: [
        tokenAt('near', 'enemy', { col: 5, row: 4 }),
        tokenAt('far', 'enemy', { col: 7, row: 4 }),
      ],
    },
    {
      skillId: 'aerialCombo',
      caster: { col: 4, row: 4 },
      anchor: { col: 7, row: 4 },
      expected: ['center', 'edge'],
      rejected: ['outside'],
      tokens: [
        tokenAt('center', 'enemy', { col: 7, row: 4 }),
        tokenAt('edge', 'enemy', { col: 9, row: 4 }),
        tokenAt('outside', 'enemy', { col: 11, row: 4 }),
      ],
    },
    {
      skillId: 'arrowStorm',
      caster: { col: 2, row: 5 },
      anchor: { col: 7, row: 5 },
      expected: ['center', 'wide'],
      rejected: ['outside'],
      tokens: [
        tokenAt('center', 'enemy', { col: 7, row: 5 }),
        tokenAt('wide', 'enemy', { col: 8, row: 5 }),
        tokenAt('outside', 'enemy', { col: 7, row: 9 }),
      ],
    },
    {
      skillId: 'focusShot',
      caster: { col: 1, row: 1 },
      anchor: { col: 7, row: 1 },
      expected: ['line-mid'],
      rejected: ['line-side'],
      tokens: [
        tokenAt('line-mid', 'enemy', { col: 4, row: 1 }),
        tokenAt('line-side', 'enemy', { col: 4, row: 3 }),
      ],
    },
    {
      skillId: 'windTraceShot',
      caster: { col: 1, row: 1 },
      anchor: { col: 12, row: 1 },
      expected: ['line-far'],
      rejected: ['line-side'],
      tokens: [
        tokenAt('line-far', 'enemy', { col: 11, row: 1 }),
        tokenAt('line-side', 'enemy', { col: 11, row: 3 }),
      ],
    },
    {
      skillId: 'spiralBlade',
      caster: { col: 4, row: 4 },
      anchor: { col: 8, row: 8 },
      expected: ['near'],
      rejected: ['far'],
      tokens: [
        tokenAt('near', 'enemy', { col: 5, row: 4 }),
        tokenAt('far', 'enemy', { col: 7, row: 4 }),
      ],
    },
  ]

  it.each(aoeCases)('selects coordinate-covered cells for $skillId', (testCase) => {
    const def = ARCHER_SKILL_TREE.find((item) => item.id === testCase.skillId)!
    const skill = skillToCombatSkill(def, 1)
    const aoe = getSkillAoeTargeting(skill)
    expect(aoe).not.toBeNull()
    if (!aoe) return

    const map = makeMap(testCase.tokens)
    const cells = cellsForAoe(aoe, testCase.caster, testCase.anchor)
    const hitIds = tokensInCells(map, testCase.tokens, cells).map((token) => token.id)

    expect(canPlaceAoe(aoe, testCase.caster, testCase.anchor)).toBe(true)
    for (const id of testCase.expected) expect(hitIds).toContain(id)
    for (const id of testCase.rejected) expect(hitIds).not.toContain(id)
  })
})

const FEATURE_CONTRACTS: Partial<Record<ClassFeatureKey, { ap?: number; qi?: number; spendUse?: boolean }>> = {
  doubleArrow: { ap: 1, spendUse: true },
  armorPiercingArrow: { spendUse: true },
  stableMind: { ap: 1, spendUse: true },
  eagleEye: { ap: 1, spendUse: true },
  preciseStrike: { ap: 1, spendUse: true },
  galeCombo: { spendUse: true },
  agileLeap: { spendUse: true },
  wildernessGuide: { spendUse: true },
  piercingInsight: {},
  silentDraw: {},
  animalMastery: {},
  calmMind: {},
  arcaneSurge: { spendUse: true },
  huntingMark: {},
  arcaneDevour: {},
  calmSpirit: {},
  trackingArrow: { ap: 1, spendUse: true },
  explosiveArrow: {},
  swiftShot: {},
  huntingCombo: {},
  swiftRecall: {},
  runeArrow: {},
  focusedSpirit: { spendUse: true },
  shadowVeil: { ap: 1, spendUse: true },
  stillWater: { ap: 1 },
  finale: { ap: 2, spendUse: true },
  arcaneDance: {},
  galeDancer: { spendUse: true },
  takeoff: { qi: 1 },
  comboFist: {},
  multiStrike: { qi: 1 },
  illusionDance: { qi: 1, spendUse: true },
  flexibleBody: { qi: 1 },
  waterWalk: { qi: 1 },
  heavyFist: { qi: 1 },
  critBlock: { qi: 1 },
  fateShackle: { qi: 1 },
  showtime: { qi: 1, spendUse: true },
  windBlade: { qi: 1 },
  transcendentSoul: {},
}

describe('archer feature resource contracts', () => {
  const activeFeatures = CLASS_FEATURE_DEFS.filter((def) => !def.deprecated)

  it('has an explicit unit-test resource contract for every active archer-line feature', () => {
    const missing = activeFeatures.map((def) => def.key).filter((key) => !FEATURE_CONTRACTS[key])

    expect(missing).toEqual([])
  })

  it.each(activeFeatures)('executes %s resource changes only through DM authority', (def) => {
    const contract = FEATURE_CONTRACTS[def.key]
    expect(contract).toBeDefined()
    if (!contract) return

    const trait = createClassTrait(def.key)
    const character = makeCharacter({
      traits: [trait],
      currentAP: 4,
      qi: 9,
    })
    const heroToken = tokenAt('hero-token', 'player', { col: 1, row: 1 }, { characterId: character.id, hp: 40, maxHp: 40 })
    const mutations: CombatMutation[] = []
    if (contract.ap) {
      mutations.push({ type: 'spend-ap', characterId: character.id, amount: contract.ap, reason: def.key })
    }
    if (contract.qi) {
      mutations.push({ type: 'spend-qi', characterId: character.id, amount: contract.qi, reason: def.key })
    }
    if (contract.spendUse && trait.maxUses > 0) {
      mutations.push({
        type: 'spend-feature-use',
        characterId: character.id,
        featureKey: def.key,
        reason: def.key,
      })
    }

    const playerResult = executeCombatMutationsAuthority(makeAuthorityState(character, makeMap([heroToken])), {
      role: 'player',
      mutations,
    })
    expect(playerResult.failures).toHaveLength(mutations.length)
    expect(playerResult.state.characters[0].currentAP).toBe(4)
    expect(playerResult.state.characters[0].qi).toBe(9)

    const dmResult = executeCombatMutationsAuthority(makeAuthorityState(character, makeMap([heroToken])), {
      role: 'dm',
      mutations,
    })

    expect(dmResult.failures).toEqual([])
    expect(dmResult.state.characters[0].currentAP).toBe(4 - (contract.ap ?? 0))
    expect(dmResult.state.characters[0].qi).toBe(9 - (contract.qi ?? 0))
    const nextTrait = dmResult.state.characters[0].traits[0]
    if (contract.spendUse && trait.maxUses > 0) {
      expect(nextTrait.uses).toBe(trait.uses - 1)
    } else {
      expect(nextTrait.uses).toBe(trait.uses)
    }
  })
})

describe('archer feature behavior contracts', () => {
  it('only arms double arrow for one-arrow basic shot and spends its feature use through authority', () => {
    const basicShot = skillToCombatSkill(BASIC_SHOT_DEF, 1)
    const multiShot = skillToCombatSkill(ARCHER_SKILL_TREE.find((def) => def.id === 'multiShot')!, 1)
    const character = makeCharacter({ traits: [createClassTrait('doubleArrow')] })

    expect(canUseDoubleArrow(character, basicShot)).toBe(true)
    expect(canUseDoubleArrow(character, multiShot)).toBe(false)
    expect(attackDamageDiceCount(basicShot, true)).toBe(2)
  })

  it('keeps double arrow extra damage as 1D4 until rank 3, then 1D6', () => {
    expect(doubleArrowExtraDamageSides(1)).toBe(4)
    expect(doubleArrowExtraDamageSides(2)).toBe(4)
    expect(doubleArrowExtraDamageSides(3)).toBe(6)
    expect(doubleArrowExtraDamageSides(4)).toBe(6)
  })

  it('routes active eagle eye through physical attack and the attack-defense modifier table', () => {
    const inactive = makeCharacter({
      abilities: { str: 25, dex: 30, con: 25, int: 25, wis: 25, cha: 25 },
      traits: [createClassTrait('eagleEye', 1)],
    })
    const active = {
      ...inactive,
      combatBuffs: { ...inactive.combatBuffs, eagleEyeTurns: 3 },
    }
    const defender = makeCharacter({
      id: 'defender',
      abilities: { str: 25, dex: 25, con: 25, int: 25, wis: 25, cha: 25 },
    })
    const inactiveAttack = characterToCombatInput(inactive)
    const activeAttack = characterToCombatInput(active)
    const defense = characterToCombatInput(defender)

    expect(computePhysicalAttack(activeAttack) - computePhysicalAttack(inactiveAttack)).toBe(20)
    expect(applyAttackDefenseDamageModifier(5, activeAttack, defense, 'physical').modifier).toBeGreaterThan(
      applyAttackDefenseDamageModifier(5, inactiveAttack, defense, 'physical').modifier,
    )
  })

  it('finds armor-piercing arrow targets behind the critical-hit target on map coordinates', () => {
    const basicShot = skillToCombatSkill(BASIC_SHOT_DEF, 1)
    const character = makeCharacter({ traits: [createClassTrait('armorPiercingArrow')] })
    const shooter = tokenAt('hero-token', 'player', { col: 1, row: 1 }, { characterId: character.id })
    const target = tokenAt('target', 'enemy', { col: 2, row: 1 })
    const behind = tokenAt('behind', 'enemy', { col: 4, row: 1 })
    const side = tokenAt('side', 'enemy', { col: 4, row: 2 })
    const map = makeMap([shooter, target, behind, side])

    expect(canUseArmorPiercing(character, basicShot, true)).toBe(true)
    expect(findTokenBehindTarget(map, shooter, target, [target, behind, side], new Set(['target']), 15)?.id).toBe('behind')
  })

  it('adds status markers through the same DM mutation path used by skill effects', () => {
    const target = makeCharacter({ id: 'target-char', currentAP: 2 })
    const targetToken = tokenAt('target-token', 'player', { col: 4, row: 1 }, {
      characterId: target.id,
      hp: 40,
      maxHp: 40,
    })
    const state = makeAuthorityState(target, makeMap([targetToken]))

    const result = executeCombatMutationsAuthority(state, {
      role: 'dm',
      mutations: [
        {
          type: 'condition',
          target: { tokenId: targetToken.id, characterId: target.id },
          condition: STUN_STATUS_LABEL,
          mode: 'add',
          turns: 1,
          reason: 'focusShot rank 4 stun',
        },
      ],
    })

    expect(result.failures).toEqual([])
    expect(result.state.characters[0].conditions).toContain(STUN_STATUS_LABEL)
    expect(result.state.map.tokens[0].stunTurns).toBe(1)
  })
})
