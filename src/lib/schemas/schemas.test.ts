import { describe, it, expect } from 'vitest'
import { registerInputSchema, loginInputSchema, createExamInputSchema, roleEnum } from './index'

describe('Zod schemas', () => {
  it('validates role enum', () => {
    expect(roleEnum.safeParse('student').success).toBe(true)
    expect(roleEnum.safeParse('invalid').success).toBe(false)
  })

  it('validates register input', () => {
    const valid = {
      email: 'test@skole.no',
      password: 'passord123',
      confirmPassword: 'passord123',
      display_name: 'Ola Nordmann',
    }
    expect(registerInputSchema.safeParse(valid).success).toBe(true)

    const mismatch = { ...valid, confirmPassword: 'annet' }
    expect(registerInputSchema.safeParse(mismatch).success).toBe(false)
  })

  it('validates login input', () => {
    expect(loginInputSchema.safeParse({ email: 'a@b.no', password: 'x' }).success).toBe(true)
    expect(loginInputSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false)
  })

  it('validates exam input difficulty sum', () => {
    const valid = {
      title: 'Prøve 1',
      subject_id: 'r1',
      total_duration_minutes: 120,
      part1_duration_minutes: 30,
      part2_duration_minutes: 90,
      competency_goals: ['R1-01'],
      difficulty_mix: { easy: 30, medium: 50, hard: 20 },
    }
    expect(createExamInputSchema.safeParse(valid).success).toBe(true)

    const bad = { ...valid, difficulty_mix: { easy: 30, medium: 50, hard: 30 } }
    expect(createExamInputSchema.safeParse(bad).success).toBe(false)
  })
})
