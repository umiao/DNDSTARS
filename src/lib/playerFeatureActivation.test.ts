import { describe, expect, it } from 'vitest'
import { shouldSendPlayerReadyFeatureToDm } from './playerFeatureActivation'

describe('player feature activation routing', () => {
  it('routes ready-state archer features through the DM authority path', () => {
    expect(shouldSendPlayerReadyFeatureToDm('doubleArrow')).toBe(true)
    expect(shouldSendPlayerReadyFeatureToDm('preciseStrike')).toBe(true)
    expect(shouldSendPlayerReadyFeatureToDm('eagleEye')).toBe(true)
  })

  it('does not route passive features as player action requests', () => {
    expect(shouldSendPlayerReadyFeatureToDm('calmMind')).toBe(false)
    expect(shouldSendPlayerReadyFeatureToDm('huntingMark')).toBe(false)
  })
})
