import type { Token } from '../store/maps'

export const NO_MOVE_LABEL = '无法移动'
export const RESTRAINED_LABEL = '束缚'

/**
 * [T4/C4/C8] A character can't move this turn if it is under either "no-move" or
 * "restrained". These were two parallel mechanisms — no-move worked, restrained did
 * nothing — so they are now unified behind one predicate. Pure for testability (T13).
 */
export function isMovementLocked(conditions: readonly string[]): boolean {
  return conditions.includes(NO_MOVE_LABEL) || conditions.includes(RESTRAINED_LABEL)
}

/** [T4/C4] token-level movement lock (for non-character actors like enemies). */
export function isTokenMovementLocked(token: Pick<Token, 'restrainedTurns' | 'noMoveTurns'>): boolean {
  return (token.restrainedTurns ?? 0) > 0 || (token.noMoveTurns ?? 0) > 0
}

/** 阵亡时从 token 上清除的状态字段 */
export const TOKEN_STATUS_CLEAR_PATCH: Partial<Token> = {
  burningTurns: 0,
  igniteTurns: 0,
  poisonTurns: 0,
  knockbackTurns: 0,
  stunTurns: 0,
  restrainedTurns: 0,
  vulnerableTurns: 0,
  noMoveTurns: 0,
  huntingMarkStacks: 0,
}
