export function isAuthoritativeActionSnapshotReady(
  appliedAt: number | undefined,
  mapsUpdatedAt: number | undefined,
  charactersUpdatedAt: number | undefined,
): boolean {
  if (!appliedAt) return true
  return (mapsUpdatedAt ?? 0) >= appliedAt && (charactersUpdatedAt ?? 0) >= appliedAt
}
