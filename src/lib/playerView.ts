import type { Character } from '../types/character'
import { playerSlotFromPort, playerSlotLabel, type PlayerSlot } from './appMode'

/** 玩家界面默认绑定的角色 ID（新冒险者） */
export const PLAYER_VIEW_CHAR_ID = 'sample-adventurer'
export const PLAYER_ASSIGNMENT_EVENT = 'stars-player-assignment-changed'

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function currentPlayerSlot(): PlayerSlot {
  return playerSlotFromPort() ?? 'player1'
}

export function playerAssignmentStorageKey(slot = currentPlayerSlot()): string {
  return `stars-player-character-id:${slot}`
}

export function getAssignedPlayerCharacterId(slot = currentPlayerSlot()): string | null {
  if (!storageAvailable()) return null
  return window.localStorage.getItem(playerAssignmentStorageKey(slot))
}

export function setAssignedPlayerCharacterId(id: string | null, slot = currentPlayerSlot()): void {
  if (!storageAvailable()) return
  const key = playerAssignmentStorageKey(slot)
  if (id) window.localStorage.setItem(key, id)
  else window.localStorage.removeItem(key)
  window.dispatchEvent(new Event(PLAYER_ASSIGNMENT_EVENT))
}

function playerAliases(slot: PlayerSlot): string[] {
  const label = playerSlotLabel(slot)
  const index = slot.slice(-1)
  return [slot, label, `玩家 ${index}`, `player${index}`, `player-${index}`, `Player ${index}`]
}

/** 玩家版只展示的本角色 */
export function getPlayerCharacter(
  characters: Character[],
  opts?: { slot?: PlayerSlot | null; assignedCharacterId?: string | null },
): Character | undefined {
  const visible = characters.filter((c) => c.visibleToPlayers !== false)
  const slot = opts?.slot ?? currentPlayerSlot()
  const assignedCharacterId = opts?.assignedCharacterId ?? getAssignedPlayerCharacterId(slot)
  if (assignedCharacterId) {
    const assigned = visible.find((c) => c.id === assignedCharacterId)
    if (assigned) return assigned
  }
  const aliases = new Set(playerAliases(slot))
  const byOwner = visible.find((c) => aliases.has(c.player))
  if (byOwner) return byOwner
  if (slot !== 'player1') return visible.length === 1 ? visible[0] : undefined
  return (
    visible.find((c) => c.id === PLAYER_VIEW_CHAR_ID) ??
    visible.find((c) => c.player === '玩家') ??
    (visible.length === 1 ? visible[0] : undefined)
  )
}

export function playerViewCharacters(
  characters: Character[],
  opts?: { slot?: PlayerSlot | null; assignedCharacterId?: string | null },
): Character[] {
  const mine = getPlayerCharacter(characters, opts)
  return mine ? [mine] : []
}
