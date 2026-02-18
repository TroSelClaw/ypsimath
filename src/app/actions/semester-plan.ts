'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { generatePlan, type AssessmentInput, type Holiday, type ScheduleDay } from '@/lib/semester/generator'

const scheduleDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  durationMinutes: z.number().int().min(30).max(240),
})

const holidaySchema = z.object({
  date: z.string().date(),
  name: z.string().min(1),
})

const assessmentSchema = z.object({
  title: z.string().min(2),
  type: z.enum(['full_day_exam', 'half_day_exam', 'short_quiz']),
  week: z.number().int().min(1).max(53),
})

const createPlanSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  scheduleDays: z.array(scheduleDaySchema).min(1),
  holidays: z.array(holidaySchema),
  assessments: z.array(assessmentSchema),
  topics: z.array(z.string().min(1)).min(1),
})

export type SemesterPlanActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createSemesterPlan(
  _prev: SemesterPlanActionState,
  formData: FormData,
): Promise<SemesterPlanActionState> {
  const profile = await getProfile()
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { error: 'Du har ikke tilgang til å opprette semesterplan.' }
  }

  const payload = formData.get('payload')
  if (typeof payload !== 'string') {
    return { error: 'Mangler data fra veiviseren.' }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(payload)
  } catch {
    return { error: 'Kunne ikke lese data fra veiviseren.' }
  }

  const parsed = createPlanSchema.safeParse(parsedJson)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = []
      fieldErrors[key].push(issue.message)
    }
    return { error: 'Noen felt mangler eller er ugyldige.', fieldErrors }
  }

  const data = parsed.data
  const supabase = await createClient()

  const classQuery = supabase
    .from('classes')
    .select('id, subject_id, teacher_id')
    .eq('id', data.classId)
    .single()

  const { data: classRow, error: classError } = await classQuery

  if (classError || !classRow) {
    return { error: 'Fant ikke klassen du valgte.' }
  }

  if (profile.role === 'teacher' && classRow.teacher_id !== profile.id) {
    return { error: 'Du kan bare opprette plan for egne klasser.' }
  }

  const entries = generatePlan({
    startDate: data.startDate,
    endDate: data.endDate,
    scheduleDays: data.scheduleDays as ScheduleDay[],
    holidays: data.holidays as Holiday[],
    assessments: data.assessments as AssessmentInput[],
    topics: data.topics,
  })

  const { data: insertedPlan, error: insertPlanError } = await supabase
    .from('semester_plans')
    .insert({
      class_id: data.classId,
      subject_id: data.subjectId,
      start_date: data.startDate,
      end_date: data.endDate,
      schedule: {
        days: data.scheduleDays,
      },
      holidays: data.holidays,
    })
    .select('id')
    .single()

  if (insertPlanError || !insertedPlan) {
    return { error: 'Kunne ikke opprette semesterplan.' }
  }

  const { error: entriesError } = await supabase.from('semester_plan_entries').insert(
    entries.map((entry) => ({
      semester_plan_id: insertedPlan.id,
      date: entry.date,
      entry_type: entry.entryType,
      topic: entry.topic,
      assessment_type: entry.assessmentType,
      title: entry.title,
      sort_order: entry.sortOrder,
      duration_minutes: entry.durationMinutes,
    })),
  )

  if (entriesError) {
    return { error: 'Planen ble opprettet, men ikke alle økter ble lagret.' }
  }

  redirect(`/laerer/semesterplan/${insertedPlan.id}`)
}
