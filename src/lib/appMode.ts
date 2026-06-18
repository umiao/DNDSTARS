export type AppMode = 'dm' | 'player'

function modeFromEnv(): AppMode | null {
  const mode = import.meta.env.VITE_APP_MODE
  return mode === 'dm' || mode === 'player' ? mode : null
}

export function modeFromPort(): AppMode | null {
  const envMode = modeFromEnv()
  if (envMode) return envMode
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
