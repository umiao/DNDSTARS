import { canWriteSharedState } from './appMode'

function sharedApiCandidates(): string[] {
  const sameOrigin = `${window.location.origin}/api`
  return [
    'http://127.0.0.1:5173/api',
    sameOrigin,
    'http://127.0.0.1:5174/api',
  ].filter((value, index, all) => all.indexOf(value) === index)
}

function sharedEventApiCandidates(): string[] {
  const sameOrigin = `${window.location.origin}/api`
  return [
    'http://127.0.0.1:5173/api',
    sameOrigin,
    'http://127.0.0.1:5174/api',
  ].filter((value, index, all) => all.indexOf(value) === index)
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  for (const api of sharedApiCandidates()) {
    try {
      const res = await fetch(`${api}${path}`, {
        ...init,
        headers: {
          ...(init?.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
          ...(init?.headers ?? {}),
        },
      })
      if (!res.ok) continue
      return (await res.json()) as T
    } catch {
      // Try the next local endpoint. DM and player ports may be started independently.
    }
  }
  return null
}

export async function loadSharedResource<T>(name: string): Promise<T | null> {
  return requestJson<T>(`/state/${name}`)
}

export async function saveSharedResource<T>(name: string, data: T): Promise<void> {
  if (
    !canWriteSharedState() &&
    name !== 'characters' &&
    name !== 'maps' &&
    name !== 'combat' &&
    name !== 'dodge' &&
    name !== 'dice' &&
    name !== 'dice-events' &&
    name !== 'combat-log'
  ) return
  await Promise.allSettled(
    sharedApiCandidates().map((api) =>
      fetch(`${api}/state/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    ),
  )
}

export async function publishSharedEvent<T>(channel: string, data: T): Promise<void> {
  await Promise.allSettled(
    sharedEventApiCandidates().map((api) =>
      fetch(`${api}/events/${encodeURIComponent(channel)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    ),
  )
}

export function subscribeSharedEvent<T>(
  channel: string,
  onMessage: (data: T) => void,
): () => void {
  const sources: EventSource[] = []
  for (const api of sharedEventApiCandidates()) {
    try {
      const source = new EventSource(`${api}/events/${encodeURIComponent(channel)}`)
      source.addEventListener('message', (event) => {
        try {
          onMessage(JSON.parse(event.data) as T)
        } catch {
          // Ignore malformed local event payloads.
        }
      })
      source.onerror = () => {
        if (source.readyState === EventSource.CLOSED) source.close()
      }
      sources.push(source)
    } catch {
      // Try every local endpoint that is available.
    }
  }
  return () => {
    for (const source of sources) source.close()
  }
}

export async function putSharedImage(id: string, blob: Blob): Promise<boolean> {
  if (!canWriteSharedState()) return false
  for (const api of sharedApiCandidates()) {
    try {
      const res = await fetch(`${api}/images/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob,
      })
      if (res.ok) return true
    } catch {
      // Try the next endpoint.
    }
  }
  return false
}

export async function getSharedImage(id: string): Promise<Blob | undefined> {
  for (const api of sharedApiCandidates()) {
    try {
      const res = await fetch(`${api}/images/${encodeURIComponent(id)}`)
      if (!res.ok) continue
      return await res.blob()
    } catch {
      // Try the next endpoint.
    }
  }
  return undefined
}

export async function deleteSharedImage(id: string): Promise<void> {
  if (!canWriteSharedState()) return
  await Promise.allSettled(
    sharedApiCandidates().map((api) =>
      fetch(`${api}/images/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    ),
  )
}
