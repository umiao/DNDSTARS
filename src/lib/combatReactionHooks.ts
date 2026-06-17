import type { Token } from '../store/maps'
import type { Character } from '../types/character'
import { findClassTrait } from './classFeatures'
import {
  type CombatInterruptChoice,
  type CombatMutation,
  type CombatResolutionContext,
  type CombatResolutionHook,
  type CombatResolutionStage,
  findCharacterForRef,
  findTokenForRef,
} from './combatResolutionPipeline'
import { cellDistance, pixelToCell } from './gridCombat'
import type { ClassFeatureKey } from './traitRegistry'

export type NearbyAllyReactionTrigger = 'ally-attacked' | 'ally-damaged'

export interface NearbyAllyReactionCandidate {
  reactor: Character
  reactorToken: Token
  target: Character
  targetToken: Token
}

export interface NearbyAllyReactionHookConfig {
  id: string
  featureKey: ClassFeatureKey
  trigger: NearbyAllyReactionTrigger
  radiusFeet?: number
  priority?: number
  stage?: CombatResolutionStage
  choices?: CombatInterruptChoice[]
  title: (candidate: NearbyAllyReactionCandidate, ctx: CombatResolutionContext) => string
  message: (candidate: NearbyAllyReactionCandidate, ctx: CombatResolutionContext) => string
  onAccepted?: (
    candidate: NearbyAllyReactionCandidate,
    ctx: CombatResolutionContext,
  ) => CombatMutation[] | void | Promise<CombatMutation[] | void>
}

export function createNearbyAllyReactionHook(config: NearbyAllyReactionHookConfig): CombatResolutionHook {
  const stage = config.stage ?? defaultStageForTrigger(config.trigger)
  const radiusFeet = config.radiusFeet ?? 10
  return {
    id: config.id,
    stage,
    priority: config.priority ?? 0,
    featureKey: config.featureKey,
    onceKey: (ctx) => `${ctx.actionId}:${config.id}`,
    canRun: (ctx) => findReactionTarget(ctx, config.trigger) != null,
    run: async (ctx, api) => {
      const targetPair = findReactionTarget(ctx, config.trigger)
      if (!targetPair) return
      const candidates = findNearbyAllyCandidates(ctx, targetPair.character, targetPair.token, radiusFeet, config.featureKey)
      for (const candidate of candidates) {
        const response = await api.requestInterrupt({
          source: { tokenId: candidate.reactorToken.id, characterId: candidate.reactor.id },
          controllerCharacterId: candidate.reactor.id,
          title: config.title(candidate, ctx),
          message: config.message(candidate, ctx),
          choices: config.choices ?? [
            { id: 'use', label: 'Use reaction', featureKey: config.featureKey },
            { id: 'decline', label: 'Decline' },
          ],
        })
        if (!response.accepted || response.choiceId === 'decline') continue
        const mutations = await config.onAccepted?.(candidate, ctx)
        for (const mutation of mutations ?? []) api.enqueueMutation(mutation)
        api.markRunOnce(`${ctx.actionId}:${config.id}:accepted`)
        return
      }
    },
  }
}

export function defaultStageForTrigger(trigger: NearbyAllyReactionTrigger): CombatResolutionStage {
  return trigger === 'ally-attacked' ? 'actionDeclared' : 'beforeDamageApplied'
}

export function tokenTeam(token: Token): 'enemy' | 'ally' | 'neutral' {
  if (token.type === 'enemy') return 'enemy'
  if (token.type === 'player' || token.type === 'npc') return 'ally'
  return 'neutral'
}

export function areAlliedTokens(a: Token, b: Token): boolean {
  const aTeam = tokenTeam(a)
  return aTeam !== 'neutral' && aTeam === tokenTeam(b)
}

export function tokenDistanceFeet(ctx: CombatResolutionContext, a: Token, b: Token): number {
  const feetPerCell = ctx.map.feetPerCell ?? 5
  const cells = cellDistance(pixelToCell(a.x, a.y, ctx.map), pixelToCell(b.x, b.y, ctx.map))
  return cells * feetPerCell
}

function findReactionTarget(
  ctx: CombatResolutionContext,
  trigger: NearbyAllyReactionTrigger,
): { character: Character; token: Token } | null {
  const targetRef =
    trigger === 'ally-damaged'
      ? ctx.pendingDamage.find((packet) => packet.amount > 0)?.target
      : ctx.primaryTarget
  const character = findCharacterForRef(ctx, targetRef)
  const token = findTokenForRef(ctx, targetRef)
  if (!character || !token) return null
  return { character, token }
}

function findNearbyAllyCandidates(
  ctx: CombatResolutionContext,
  target: Character,
  targetToken: Token,
  radiusFeet: number,
  featureKey: ClassFeatureKey,
): NearbyAllyReactionCandidate[] {
  const candidates: NearbyAllyReactionCandidate[] = []
  for (const reactor of ctx.characters) {
    if (reactor.id === target.id || reactor.currentHp <= 0) continue
    if (!findClassTrait(reactor, featureKey)) continue
    const reactorToken = ctx.map.tokens.find((token) => token.characterId === reactor.id)
    if (!reactorToken || !areAlliedTokens(reactorToken, targetToken)) continue
    if (tokenDistanceFeet(ctx, reactorToken, targetToken) > radiusFeet) continue
    candidates.push({ reactor, reactorToken, target, targetToken })
  }
  return candidates
}
