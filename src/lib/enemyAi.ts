import type { BattleMap, Token } from '../store/maps'
import type { Character } from '../types/character'
import { abilityMod } from './dnd'
import { enemyCombatInput } from './enemyCombatStats'
import { getEnemyStatBlock } from './enemyStatBlocks'
import {
  cellDistance,
  cellToPixel,
  isPlayerToken,
  occupiedCells,
  pixelToCell,
  stepToward,
  type GridCell,
} from './gridCombat'

const MOVE_CELLS_PER_TURN = 6
const MELEE_RANGE_CELLS = 1
const ATTACK_DICE = { count: 1, sides: 6 }

export interface EnemyAttackRoll {
  values: number[]
  sides: number
  bonus: number
  total: number
  label: string
  targetName: string
}

export interface EnemyTurnResult {
  moved: boolean
  moveApSpent?: number
  newPosition?: { x: number; y: number }
  attacked: boolean
  attackerTokenId?: string
  targetTokenId?: string
  attack?: EnemyAttackRoll
  /** 物理攻击默认命中；范围法术需敏捷豁免 */
  damageType?: 'physical' | 'aoe'
  /** 范围法术敏捷豁免 DC */
  saveDC?: number
  /** 对 token 自身 HP 的补丁 */
  targetTokenPatch?: Partial<Token>
  /** 对关联角色的伤害 */
  targetCharacterId?: string
  damage?: number
  message: string
}

function enemyMeleeDexBonus(enemy: Token): number {
  if (enemy.poolId) {
    const stats = getEnemyStatBlock(enemy.poolId)
    if (stats) return abilityMod(stats.abilities.dex)
  }
  return 2
}

function findNearestPlayer(
  enemyCell: GridCell,
  players: Token[],
  map: BattleMap,
): { token: Token; cell: GridCell; dist: number } | null {
  let best: { token: Token; cell: GridCell; dist: number } | null = null
  for (const t of players) {
    const cell = pixelToCell(t.x, t.y, map)
    const dist = cellDistance(enemyCell, cell)
    if (!best || dist < best.dist) best = { token: t, cell, dist }
  }
  return best
}

function moveTowardTarget(
  start: GridCell,
  target: GridCell,
  map: BattleMap,
  tokens: Token[],
  enemyId: string,
  maxSteps: number,
): GridCell {
  let current = start
  const blocked = occupiedCells(tokens, map, enemyId)

  for (let i = 0; i < maxSteps; i++) {
    if (cellDistance(current, target) <= MELEE_RANGE_CELLS) break
    const next = stepToward(current, target)
    if (cellDistance(next, target) >= cellDistance(current, target)) break
    const key = `${next.col},${next.row}`
    if (blocked.has(key)) break
    current = next
    blocked.add(key)
  }
  return current
}

/** 敌人回合：向最近玩家移动，邻接后近战攻击一次 */
function resolveTokenCharacterId(token: Token): string | undefined {
  if (token.characterId) return token.characterId
  return undefined
}

export function planEnemyTurn(
  map: BattleMap,
  enemy: Token,
  _characters?: Character[],
  availableAp = 2,
  context?: { round?: number },
): EnemyTurnResult {
  const players = map.tokens.filter(isPlayerToken)
  if (players.length === 0) {
    return { moved: false, attacked: false, message: `${enemy.label} 找不到玩家 token。` }
  }

  const startCell = pixelToCell(enemy.x, enemy.y, map)
  const nearest = findNearestPlayer(startCell, players, map)!
  if (enemy.poolId === 'wyrmling-red' && (context?.round ?? 1) === 1 && availableAp >= 1) {
    return {
      moved: false,
      attacked: true,
      attackerTokenId: enemy.id,
      targetTokenId: nearest.token.id,
      damageType: 'aoe',
      saveDC: 12,
      attack: {
        values: [],
        sides: 6,
        bonus: 0,
        total: 24,
        label: '火焰吐息 4d6（敏捷豁免成功半伤）',
        targetName: nearest.token.label,
      },
      damage: 24,
      targetCharacterId: resolveTokenCharacterId(nearest.token),
      message: `${enemy.label} 使用火焰吐息，${nearest.token.label} 进行 DC12 敏捷豁免。`,
    }
  }
  let endCell = startCell

  const startDist = cellDistance(startCell, nearest.cell)
  const canDoubleMove = availableAp >= 2
  const needsDoubleMove = canDoubleMove && startDist > MOVE_CELLS_PER_TURN + MELEE_RANGE_CELLS
  const moveBudget = needsDoubleMove ? MOVE_CELLS_PER_TURN * 2 : MOVE_CELLS_PER_TURN

  if (startDist > MELEE_RANGE_CELLS) {
    endCell = moveTowardTarget(startCell, nearest.cell, map, map.tokens, enemy.id, moveBudget)
  }

  const moved = endCell.col !== startCell.col || endCell.row !== startCell.row
  const moveApSpent = moved ? (needsDoubleMove ? 2 : 1) : 0
  const afterMoveDist = cellDistance(endCell, nearest.cell)
  const pos = moved ? cellToPixel(endCell, map) : undefined

  if (afterMoveDist > MELEE_RANGE_CELLS || moveApSpent >= availableAp) {
    return {
      moved,
      moveApSpent,
      newPosition: pos,
      attacked: false,
      message: moved
        ? `${enemy.label} 向 ${nearest.token.label} 移动，但够不着。`
        : `${enemy.label} 无法靠近 ${nearest.token.label}。`,
    }
  }

  const values: number[] = []
  const total = 1
  let diceLabel: string
  let attackBonus: number

  const derived = enemy.poolId ? enemyCombatInput(enemy.poolId) : undefined
  if (derived) {
    attackBonus = 0
    diceLabel = `${ATTACK_DICE.count}d${ATTACK_DICE.sides}`
  } else {
    const dexBonus = enemyMeleeDexBonus(enemy)
    attackBonus = dexBonus
    diceLabel = `${ATTACK_DICE.count}d${ATTACK_DICE.sides}${dexBonus >= 0 ? '+' : ''}${dexBonus}`
  }
  const target = nearest.token
  const targetCharacterId = resolveTokenCharacterId(target)

  const result: EnemyTurnResult = {
    moved,
    moveApSpent,
    newPosition: pos,
    attacked: true,
    attackerTokenId: enemy.id,
    targetTokenId: target.id,
    attack: {
      values,
      sides: ATTACK_DICE.sides,
      bonus: attackBonus,
      total,
      label: `近战 ${diceLabel}`,
      targetName: target.label,
    },
    damage: total,
    message: `${enemy.label} ${moved ? '移动后' : ''}攻击 ${target.label}，造成 ${total} 点伤害。`,
  }

  if (targetCharacterId) {
    result.targetCharacterId = targetCharacterId
  }

  return result
}
