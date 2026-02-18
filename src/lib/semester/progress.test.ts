import { describe, expect, test } from 'vitest'

import { buildMasteredTopicSet, computeScheduleStatus } from './progress'

describe('semester progress', () => {
  test('builds mastered topic set from mastered competency goals', () => {
    const topicGoals = new Map([
      ['Derivasjon', ['R1-4', 'R1-5']],
      ['Vektorer', ['R1-9']],
    ])

    const mastered = buildMasteredTopicSet({
      topicEntries: [
        { topic: 'Derivasjon', date: '2026-03-01' },
        { topic: 'Vektorer', date: '2026-03-08' },
      ],
      topicGoals,
      masteredGoals: ['R1-4', 'R1-5'],
    })

    expect(mastered.has('Derivasjon')).toBe(true)
    expect(mastered.has('Vektorer')).toBe(false)
  })

  test('returns ahead status when completed topics exceed planned topics up to today', () => {
    const status = computeScheduleStatus({
      topicEntries: [
        { topic: 'Algebra', date: '2026-03-01' },
        { topic: 'Derivasjon', date: '2026-03-10' },
      ],
      masteredTopics: new Set(['Algebra', 'Derivasjon']),
      today: new Date('2026-03-05T10:00:00'),
    })

    expect(status.kind).toBe('ahead')
    expect(status.label).toContain('foran plan')
  })
})
