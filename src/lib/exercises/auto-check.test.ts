import { describe, expect, it } from 'vitest'
import { autoCheckExercise, checkMultipleChoice, checkNumericInput } from './auto-check'

describe('checkMultipleChoice', () => {
  it('matcher svar case-insensitive og trimmet', () => {
    expect(checkMultipleChoice('  A ', 'a')).toBe(true)
    expect(checkMultipleChoice('B', 'a')).toBe(false)
  })
})

describe('checkNumericInput', () => {
  it('godtar komma eller punktum og eksakt match', () => {
    expect(checkNumericInput('2,5', 2.5)).toBe(true)
    expect(checkNumericInput('2.5', '2,5')).toBe(true)
  })

  it('respekterer toleransevindu', () => {
    expect(checkNumericInput('9.9', 10, 0.2)).toBe(true)
    expect(checkNumericInput('9.7', 10, 0.2)).toBe(false)
  })
})

describe('autoCheckExercise', () => {
  it('returnerer null for formater uten autosjekk', () => {
    expect(
      autoCheckExercise({
        format: 'freeform',
        answer: 'x',
        userAnswer: 'x',
      }),
    ).toBeNull()
  })
})
