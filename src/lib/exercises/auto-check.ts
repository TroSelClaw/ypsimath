export type ExerciseFormat = 'freeform' | 'multiple_choice' | 'numeric_input' | 'drag_drop' | 'interactive'

export interface AutoCheckInput {
  format: ExerciseFormat
  answer?: string | number | null
  userAnswer: string
  tolerance?: number | null
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function normalizeNumber(value: string) {
  const normalized = value.trim().replace(',', '.')
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

export function checkMultipleChoice(userAnswer: string, expected: string) {
  return normalizeText(userAnswer) === normalizeText(expected)
}

export function checkNumericInput(userAnswer: string, expected: string | number, tolerance?: number | null) {
  const user = normalizeNumber(userAnswer)
  const target = typeof expected === 'number' ? expected : normalizeNumber(String(expected))

  if (user === null || target === null) {
    return false
  }

  const allowedDelta = tolerance ?? 0
  return Math.abs(user - target) <= allowedDelta
}

export function autoCheckExercise(input: AutoCheckInput): boolean | null {
  if (input.format === 'multiple_choice' && input.answer != null) {
    return checkMultipleChoice(input.userAnswer, String(input.answer))
  }

  if (input.format === 'numeric_input' && input.answer != null) {
    return checkNumericInput(input.userAnswer, input.answer, input.tolerance)
  }

  return null
}
