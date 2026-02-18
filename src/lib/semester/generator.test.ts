import { describe, expect, it } from 'vitest'
import { generatePlan } from './generator'

describe('generatePlan', () => {
  it('generates topic entries on selected weekdays and skips holidays', () => {
    const entries = generatePlan({
      startDate: '2026-08-17',
      endDate: '2026-08-24',
      scheduleDays: [
        { weekday: 1, startTime: '08:30', durationMinutes: 90 },
        { weekday: 3, startTime: '10:15', durationMinutes: 90 },
      ],
      holidays: [{ date: '2026-08-19', name: 'Planleggingsdag' }],
      topics: ['Funksjoner', 'Derivasjon'],
      assessments: [],
    })

    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({ date: '2026-08-17', entryType: 'topic', title: 'Funksjoner' })
    expect(entries[1]).toMatchObject({ date: '2026-08-19', entryType: 'holiday' })
    expect(entries[2]).toMatchObject({ date: '2026-08-24', entryType: 'topic', title: 'Derivasjon' })
  })

  it('adds assessments in matching ISO week', () => {
    const entries = generatePlan({
      startDate: '2026-08-17',
      endDate: '2026-08-31',
      scheduleDays: [{ weekday: 1, startTime: '08:30', durationMinutes: 90 }],
      holidays: [],
      topics: ['Funksjoner', 'Derivasjon', 'Integrasjon'],
      assessments: [{ title: 'Kapittelprøve 1', type: 'short_quiz', week: 35 }],
    })

    const assessment = entries.find((entry) => entry.entryType === 'assessment')
    expect(assessment).toBeDefined()
    expect(assessment).toMatchObject({ title: 'Kapittelprøve 1', assessmentType: 'short_quiz' })
  })
})
