import { describe, expect, it } from 'vitest'
import { buildCrossSubjectSearchConfig } from './hybrid-search'

describe('buildCrossSubjectSearchConfig', () => {
  it('keeps search scoped to current subject for typical profile', () => {
    const config = buildCrossSubjectSearchConfig({
      currentSubject: 'r1',
      masteredGoals: ['R1-01', 'R1-02'],
      strugglingGoals: ['R1-07'],
    })

    expect(config.mode).toBe('default')
    expect(config.subjectIds).toEqual(['r1'])
    expect(config.subjectBoosts.r1).toBeGreaterThan(1)
  })

  it('enables advanced cross-subject boosting for strong students', () => {
    const config = buildCrossSubjectSearchConfig({
      currentSubject: 'r1',
      masteredGoals: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      strugglingGoals: [],
    })

    expect(config.mode).toBe('advanced')
    expect(config.subjectIds).toBeUndefined()
    expect(config.subjectBoosts.r2).toBeGreaterThan(1)
  })

  it('enables supportive cross-subject boosting for struggling students', () => {
    const config = buildCrossSubjectSearchConfig({
      currentSubject: 'r1',
      masteredGoals: ['R1-01'],
      strugglingGoals: ['a', 'b', 'c', 'd', 'e'],
    })

    expect(config.mode).toBe('supportive')
    expect(config.subjectIds).toBeUndefined()
    expect(config.subjectBoosts['1t']).toBeGreaterThan(1)
    expect(config.subjectBoosts['1p']).toBeGreaterThan(1)
  })
})
