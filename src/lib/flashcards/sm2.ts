export interface Sm2Input {
  quality: number
  repetitions: number
  intervalDays: number
  easeFactor: number
  reviewedAt?: Date
}

export interface Sm2Result {
  repetitions: number
  intervalDays: number
  easeFactor: number
  nextReviewDate: string
}

function clampQuality(quality: number) {
  return Math.max(0, Math.min(5, Math.round(quality)))
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function runSm2(input: Sm2Input): Sm2Result {
  const quality = clampQuality(input.quality)
  const reviewedAt = input.reviewedAt ?? new Date()

  let repetitions = input.repetitions
  let intervalDays = input.intervalDays
  let easeFactor = input.easeFactor

  if (quality < 3) {
    repetitions = 0
    intervalDays = 1
  } else {
    repetitions += 1

    if (repetitions === 1) {
      intervalDays = 1
    } else if (repetitions === 2) {
      intervalDays = 6
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor))
    }
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(1.3, Math.round(easeFactor * 100) / 100)

  const next = new Date(reviewedAt)
  next.setDate(next.getDate() + intervalDays)

  return {
    repetitions,
    intervalDays,
    easeFactor,
    nextReviewDate: toIsoDate(next),
  }
}
