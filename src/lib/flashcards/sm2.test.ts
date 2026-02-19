import { describe, expect, it } from 'vitest'
import { runSm2 } from './sm2'

describe('runSm2', () => {
  it('uses 1 day interval on first successful repetition', () => {
    const result = runSm2({
      quality: 5,
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      reviewedAt: new Date('2026-02-19T00:00:00Z'),
    })

    expect(result.repetitions).toBe(1)
    expect(result.intervalDays).toBe(1)
    expect(result.nextReviewDate).toBe('2026-02-20')
  })

  it('uses 6 day interval on second successful repetition', () => {
    const result = runSm2({
      quality: 5,
      repetitions: 1,
      intervalDays: 1,
      easeFactor: 2.5,
      reviewedAt: new Date('2026-02-19T00:00:00Z'),
    })

    expect(result.repetitions).toBe(2)
    expect(result.intervalDays).toBe(6)
    expect(result.nextReviewDate).toBe('2026-02-25')
  })

  it('resets repetitions when quality is below 3', () => {
    const result = runSm2({
      quality: 1,
      repetitions: 4,
      intervalDays: 20,
      easeFactor: 2.5,
      reviewedAt: new Date('2026-02-19T00:00:00Z'),
    })

    expect(result.repetitions).toBe(0)
    expect(result.intervalDays).toBe(1)
    expect(result.nextReviewDate).toBe('2026-02-20')
  })

  it('never lets ease factor go below 1.3', () => {
    const result = runSm2({
      quality: 0,
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 1.3,
      reviewedAt: new Date('2026-02-19T00:00:00Z'),
    })

    expect(result.easeFactor).toBe(1.3)
  })
})
