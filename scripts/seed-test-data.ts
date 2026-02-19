#!/usr/bin/env npx tsx
/**
 * TASK-075: Seed user-testing data (accounts, content, semester plan, activity)
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 *   npx tsx scripts/seed-test-data.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js'

interface CliArgs {
  dryRun: boolean
}

function parseArgs(): CliArgs {
  return {
    dryRun: process.argv.includes('--dry-run'),
  }
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} mangler i miljøet`)
  return value
}

const TEST_TEACHER_EMAIL = 'test.laerer@ypsimath.test'
const STUDENT_EMAILS = Array.from({ length: 10 }, (_, i) => `test.elev${String(i + 1).padStart(2, '0')}@ypsimath.test`)

const TOPICS = [
  {
    chapter: 'Derivasjon',
    topic: 'Introduksjon til den deriverte',
    goals: ['R1-02', 'R1-04'],
  },
  {
    chapter: 'Derivasjon',
    topic: 'Derivasjonsregler',
    goals: ['R1-04', 'R1-05'],
  },
  {
    chapter: 'Vektorer',
    topic: 'Vektorregning i planet',
    goals: ['R1-11', 'R1-12'],
  },
] as const

async function ensureUser(
  supabase: any,
  email: string,
  role: 'teacher' | 'student',
  displayName: string,
) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const existing = list.users.find((user: any) => user.email?.toLowerCase() === email.toLowerCase())
  if (existing) {
    await supabase
      .from('profiles')
      .update({ display_name: displayName, role })
      .eq('id', existing.id)
    return existing.id
  }

  const password = `YpsiMath!${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: displayName, role },
  })
  if (error || !data.user) throw error ?? new Error('Kunne ikke opprette bruker')

  await supabase
    .from('profiles')
    .update({ display_name: displayName, role })
    .eq('id', data.user.id)

  console.log(`Opprettet ${email} med passord: ${password}`)
  return data.user.id
}

async function ensureStudentProfile(supabase: any, userId: string) {
  await supabase.from('student_profiles').upsert({
    id: userId,
    current_subject: 'r1',
    goals: { target_grade: 4, focus_areas: ['derivasjon'] },
    total_exercises_completed: 12,
    total_time_spent_minutes: 90,
  })
}

async function ensureTestContent(supabase: any) {
  const rows: Array<Record<string, unknown>> = []
  for (const [topicIndex, topic] of TOPICS.entries()) {
    const baseSort = topicIndex * 100
    rows.push(
      {
        subject_id: 'r1',
        chapter: topic.chapter,
        topic: topic.topic,
        sort_order: baseSort + 1,
        content_type: 'theory',
        content: `# ${topic.topic}\nDette er teori for bruker-testing.`,
        competency_goals: topic.goals,
        status: 'published',
      },
      {
        subject_id: 'r1',
        chapter: topic.chapter,
        topic: topic.topic,
        sort_order: baseSort + 2,
        content_type: 'rule',
        content: `Huskeregel for ${topic.topic}.`,
        competency_goals: topic.goals,
        status: 'published',
      },
      {
        subject_id: 'r1',
        chapter: topic.chapter,
        topic: topic.topic,
        sort_order: baseSort + 3,
        content_type: 'example',
        content: `Eksempeloppgave for ${topic.topic}.`,
        competency_goals: topic.goals,
        status: 'published',
      },
      {
        subject_id: 'r1',
        chapter: topic.chapter,
        topic: topic.topic,
        sort_order: baseSort + 4,
        content_type: 'exercise',
        exercise_format: 'multiple_choice',
        content: `Hva er riktig svar i ${topic.topic}?`,
        content_metadata: {
          options: ['A', 'B', 'C', 'D'],
          answer: 'B',
          hints: ['Start med definisjonen.'],
        },
        competency_goals: topic.goals,
        status: 'published',
      },
      {
        subject_id: 'r1',
        chapter: topic.chapter,
        topic: topic.topic,
        sort_order: baseSort + 5,
        content_type: 'flashcard',
        content: `## Kort\nQ: Hva er nøkkelideen i ${topic.topic}?\nA: Kjernedefinisjonen.`,
        content_metadata: {
          front: `Nøkkelidé i ${topic.topic}`,
          back: 'Kjernedefinisjonen',
        },
        competency_goals: topic.goals,
        status: 'published',
      },
    )
  }

  const { error } = await supabase.from('content_elements').upsert(rows, {
    onConflict: 'subject_id,topic,sort_order',
    ignoreDuplicates: false,
  })

  if (error) {
    // fallback for instances without composite unique constraint
    if (!error.message.includes('there is no unique or exclusion constraint')) throw error
    for (const row of rows) {
      const { data: existing } = await supabase
        .from('content_elements')
        .select('id')
        .eq('subject_id', row.subject_id as string)
        .eq('topic', row.topic as string)
        .eq('sort_order', row.sort_order as number)
        .maybeSingle()

      if (!existing) {
        await supabase.from('content_elements').insert(row)
      }
    }
  }
}

async function ensureClassAndPlan(
  supabase: any,
  teacherId: string,
  studentIds: string[],
) {
  const { data: existingClass } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('name', 'R1 Brukertestklasse')
    .maybeSingle()

  let classId = existingClass?.id

  if (!classId) {
    const { data: createdClass, error: classError } = await supabase
      .from('classes')
      .insert({
        name: 'R1 Brukertestklasse',
        subject_id: 'r1',
        teacher_id: teacherId,
        school_year: '2025/2026',
      })
      .select('id')
      .single()

    if (classError || !createdClass) throw classError ?? new Error('Kunne ikke opprette testklasse')
    classId = createdClass.id
  }

  const memberships = studentIds.map((studentId) => ({ class_id: classId!, student_id: studentId }))
  await supabase.from('class_memberships').upsert(memberships, { onConflict: 'class_id,student_id' })

  const today = new Date()
  const inDays = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const { data: plan, error: planError } = await supabase
    .from('semester_plans')
    .insert({
      class_id: classId,
      subject_id: 'r1',
      start_date: inDays(-14),
      end_date: inDays(90),
      schedule: { days: ['monday', 'wednesday'] },
      holidays: [],
    })
    .select('id')
    .single()

  if (planError || !plan) throw planError ?? new Error('Kunne ikke opprette semesterplan')

  const entries = TOPICS.map((topic, i) => ({
    semester_plan_id: plan.id,
    date: inDays(i * 7),
    entry_type: 'topic',
    topic: topic.topic,
    title: topic.topic,
    sort_order: i,
    duration_minutes: 90,
  }))

  await supabase.from('semester_plan_entries').insert(entries)

  for (const studentId of studentIds) {
    await supabase.from('activity_log').insert([
      {
        user_id: studentId,
        activity_type: 'wiki_view',
        subject_id: 'r1',
        topic: TOPICS[0].topic,
        duration_seconds: 420,
      },
      {
        user_id: studentId,
        activity_type: 'exercise_attempt',
        subject_id: 'r1',
        topic: TOPICS[0].topic,
        metadata: { result: 'correct' },
      },
      {
        user_id: studentId,
        activity_type: 'chat_message',
        subject_id: 'r1',
        topic: TOPICS[1].topic,
      },
    ])
  }
}

async function main() {
  const { dryRun } = parseArgs()
  const supabase: any = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_KEY'))

  if (dryRun) {
    console.log('Dry-run: ville ha opprettet testbrukere, testinnhold, semesterplan og aktivitetsdata.')
    return
  }

  const teacherId = await ensureUser(supabase, TEST_TEACHER_EMAIL, 'teacher', 'Testlærer')
  const studentIds: string[] = []

  for (const [index, email] of STUDENT_EMAILS.entries()) {
    const id = await ensureUser(supabase, email, 'student', `Testelev ${index + 1}`)
    await ensureStudentProfile(supabase, id)
    studentIds.push(id)
  }

  await ensureTestContent(supabase)
  await ensureClassAndPlan(supabase, teacherId, studentIds)

  console.log('Ferdig: testdata for TASK-075 er seeded.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
