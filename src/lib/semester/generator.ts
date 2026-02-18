export type ScheduleDay = {
  weekday: number
  startTime: string
  durationMinutes: number
}

export type Holiday = {
  date: string
  name: string
}

export type AssessmentInput = {
  title: string
  type: 'full_day_exam' | 'half_day_exam' | 'short_quiz'
  week: number
}

export type SemesterGeneratorConfig = {
  startDate: string
  endDate: string
  scheduleDays: ScheduleDay[]
  holidays: Holiday[]
  topics: string[]
  assessments: AssessmentInput[]
}

export type GeneratedSemesterEntry = {
  date: string
  entryType: 'topic' | 'assessment' | 'holiday'
  title: string
  topic: string | null
  assessmentType: AssessmentInput['type'] | null
  sortOrder: number
  durationMinutes: number
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getIsoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function buildHolidaySet(holidays: Holiday[]) {
  return new Set(holidays.map((h) => h.date))
}

export function generatePlan(config: SemesterGeneratorConfig): GeneratedSemesterEntry[] {
  const start = new Date(`${config.startDate}T00:00:00.000Z`)
  const end = new Date(`${config.endDate}T00:00:00.000Z`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Ugyldig datoperiode for semesterplan')
  }

  const scheduleByWeekday = new Map<number, ScheduleDay>()
  for (const day of config.scheduleDays) {
    scheduleByWeekday.set(day.weekday, day)
  }

  const holidayDates = buildHolidaySet(config.holidays)
  const entries: GeneratedSemesterEntry[] = []
  let topicIndex = 0

  const cursor = new Date(start)
  while (cursor <= end) {
    const isoDate = toIsoDate(cursor)
    const weekday = cursor.getUTCDay()
    const scheduledDay = scheduleByWeekday.get(weekday)

    if (scheduledDay) {
      if (holidayDates.has(isoDate)) {
        const holiday = config.holidays.find((h) => h.date === isoDate)
        entries.push({
          date: isoDate,
          entryType: 'holiday',
          title: holiday ? `Ferie: ${holiday.name}` : 'Ferie',
          topic: null,
          assessmentType: null,
          sortOrder: entries.length,
          durationMinutes: scheduledDay.durationMinutes,
        })
      } else {
        const topic = config.topics[topicIndex] ?? config.topics[config.topics.length - 1] ?? 'Repetisjon'
        entries.push({
          date: isoDate,
          entryType: 'topic',
          title: topic,
          topic,
          assessmentType: null,
          sortOrder: entries.length,
          durationMinutes: scheduledDay.durationMinutes,
        })
        if (topicIndex < config.topics.length - 1) {
          topicIndex += 1
        }
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  for (const assessment of config.assessments) {
    const slot = entries.find(
      (entry) => entry.entryType === 'topic' && getIsoWeek(new Date(`${entry.date}T00:00:00.000Z`)) === assessment.week,
    )

    if (!slot) continue

    entries.push({
      date: slot.date,
      entryType: 'assessment',
      title: assessment.title,
      topic: null,
      assessmentType: assessment.type,
      sortOrder: entries.length,
      durationMinutes: slot.durationMinutes,
    })
  }

  return entries
    .sort((a, b) => (a.date === b.date ? a.sortOrder - b.sortOrder : a.date.localeCompare(b.date)))
    .map((entry, index) => ({ ...entry, sortOrder: index }))
}
