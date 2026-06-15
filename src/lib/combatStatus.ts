import type { Token } from '../store/maps'

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
