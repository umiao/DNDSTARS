import type { Character } from '../types/character'

/** 玩家界面默认绑定的角色 ID（新冒险者） */
export const PLAYER_VIEW_CHAR_ID = 'sample-adventurer'

/** 玩家版只展示的本角色 */
export function getPlayerCharacter(characters: Character[]): Character | undefined {
  const visible = characters.filter((c) => c.visibleToPlayers)
  return (
    visible.find((c) => c.id === PLAYER_VIEW_CHAR_ID) ??
    visible.find((c) => c.player === '玩家') ??
    (visible.length === 1 ? visible[0] : undefined)
  )
}

export function playerViewCharacters(characters: Character[]): Character[] {
  const mine = getPlayerCharacter(characters)
  return mine ? [mine] : []
}
