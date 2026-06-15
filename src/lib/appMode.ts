export type AppMode = 'dm' | 'player'

export function modeFromPort(): AppMode | null {
  if (window.location.port === '5173') return 'dm'
  if (window.location.port === '5174') return 'player'
  return null
}

export function isPlayerPort(): boolean {
  return modeFromPort() === 'player'
}

export function canWriteSharedState(): boolean {
  return modeFromPort() !== 'player'
}
