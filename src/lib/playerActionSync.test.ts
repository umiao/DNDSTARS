import { describe, expect, it } from 'vitest'
import { isAuthoritativeActionSnapshotReady } from './playerActionSync'

describe('player action sync barrier', () => {
  it('is ready when no authoritative appliedAt barrier is provided', () => {
    expect(isAuthoritativeActionSnapshotReady(undefined, undefined, undefined)).toBe(true)
  })

  it('waits until both maps and characters reach the DM appliedAt watermark', () => {
    expect(isAuthoritativeActionSnapshotReady(1000, 1000, 999)).toBe(false)
    expect(isAuthoritativeActionSnapshotReady(1000, 999, 1000)).toBe(false)
    expect(isAuthoritativeActionSnapshotReady(1000, 1000, 1000)).toBe(true)
    expect(isAuthoritativeActionSnapshotReady(1000, 1200, 1100)).toBe(true)
  })
})
