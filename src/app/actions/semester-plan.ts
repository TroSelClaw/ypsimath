'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { generatePlan, type AssessmentInput, type Holiday, type ScheduleDay } from '@/lib/semester/generator'

const semesterEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  sortOrder: z.number().int().min(0),
})

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

async function assertPlanAccess(planId: string, profileId: string, role: string) {
  const supabase = await createClient()

  const { data: planRow, error } = await supabase
    .from('semester_plans')
    .select('id, class_id, version, classes!inner(teacher_id)')
    .eq('id', planId)
    .single()

  if (error || !planRow) {
    throw new Error('Fant ikke semesterplanen.')
  }

  const classRows = planRow.classes as Array<{ teacher_id: string }>
  const teacherId = classRows[0]?.teacher_id
  if (!teacherId) {
    throw new Error('Fant ikke klassekobling for semesterplanen.')
  }
  if (role === 'teacher' && teacherId !== profileId) {
    throw new Error('Du har ikke tilgang til denne semesterplanen.')
  }

  return { supabase, planRow }
}

export async function updateSemesterPlanEntries(
  planId: string,
  updates: Array<{ id: string; date: string; sortOrder: number }>,
) {
  const profile = await getProfile()
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { error: 'Du har ikke tilgang.' }
  }

  try {
    const parsed = z.array(semesterEntrySchema).min(1).parse(updates)
    const { supabase } = await assertPlanAccess(planId, profile.id, profile.role)

    for (const entry of parsed) {
      const { error } = await supabase
        .from('semester_plan_entries')
        .update({ date: entry.date, sort_order: entry.sortOrder })
        .eq('id', entry.id)
        .eq('semester_plan_id', planId)

      if (error) throw new Error('Kunne ikke lagre endringer i semesterplanen.')
    }

    await supabase
      .from('semester_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', planId)

    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Ukjent feil ved lagring.' }
  }
}

export async function saveSemesterPlanVersion(planId: string, note?: string) {
  const profile = await getProfile()
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { error: 'Du har ikke tilgang.' }
  }

  try {
    const { supabase, planRow } = await assertPlanAccess(planId, profile.id, profile.role)

    const { data: entries, error: entriesError } = await supabase
      .from('semester_plan_entries')
      .select('id, date, entry_type, topic, assessment_type, title, sort_order, duration_minutes')
      .eq('semester_plan_id', planId)
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true })

    if (entriesError) throw new Error('Kunne ikke hente planinnhold for versjonering.')

    const nextVersion = ((planRow.version as number) ?? 1) + 1

    const { error: versionError } = await supabase.from('semester_plan_versions').insert({
      semester_plan_id: planId,
      version: nextVersion,
      snapshot: {
        savedAt: new Date().toISOString(),
        entries,
      },
      change_note: note?.trim() || 'Manuell versjonslagring',
    })

    if (versionError) throw new Error('Kunne ikke lagre planversjon.')

    const { error: planUpdateError } = await supabase
      .from('semester_plans')
      .update({ version: nextVersion, updated_at: new Date().toISOString() })
      .eq('id', planId)

    if (planUpdateError) throw new Error('Kunne ikke oppdatere planversjon.')

    return { ok: true, version: nextVersion }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Ukjent feil ved versjonslagring.' }
  }
}

export async function applySemesterPlanChatEdit(planId: string, command: string) {
  const profile = await getProfile()
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { error: 'Du har ikke tilgang.' }
  }

  try {
    const trimmed = command.trim()
    if (!trimmed) return { error: 'Skriv en kommando først.' }

    const { supabase } = await assertPlanAccess(planId, profile.id, profile.role)

    const { data: entries, error } = await supabase
      .from('semester_plan_entries')
      .select('id, date, entry_type, topic, title, sort_order')
      .eq('semester_plan_id', planId)
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error || !entries) throw new Error('Kunne ikke hente semesterplanen.')

    const match = /^flytt\s+(.+?)\s+til\s+etter\s+(.+)$/i.exec(trimmed)
    if (!match) {
      return {
        error:
          'Støttet format akkurat nå: "Flytt <tema> til etter <tema/periode>". Endringen ble ikke utført.',
      }
    }

    const fromNeedle = match[1].trim().toLowerCase()
    const toNeedle = match[2].trim().toLowerCase()

    const movable = entries.filter((entry) => entry.entry_type === 'topic')
    const fromEntry = movable.find(
      (entry) => (entry.topic ?? entry.title).toLowerCase().includes(fromNeedle),
    )
    const toEntry = movable.find((entry) => (entry.topic ?? entry.title).toLowerCase().includes(toNeedle))

    if (!fromEntry || !toEntry) {
      return { error: 'Fant ikke begge temaene i planen. Ingen endring gjort.' }
    }

    const without = movable.filter((entry) => entry.id !== fromEntry.id)
    const targetIndex = without.findIndex((entry) => entry.id === toEntry.id)
    without.splice(targetIndex + 1, 0, fromEntry)

    const datePool = movable.map((entry) => entry.date).sort((a, b) => a.localeCompare(b))
    const updates = without.map((entry, idx) => ({
      id: entry.id,
      date: datePool[idx] ?? entry.date,
      sort_order: idx,
    }))

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('semester_plan_entries')
        .update({ date: update.date, sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('semester_plan_id', planId)

      if (updateError) throw new Error('Kunne ikke oppdatere planen etter chat-kommando.')
    }

    await supabase
      .from('semester_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', planId)

    return { ok: true, message: `Flyttet «${fromEntry.title}» til etter «${toEntry.title}».` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Ukjent feil i chat-redigering.' }
  }
}
