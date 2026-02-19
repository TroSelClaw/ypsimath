import { NextResponse } from 'next/server'
import { z } from 'zod/v4'

import { generateAssessmentReport } from '@/lib/ai/assessment-report'
import { RATE_LIMITS, rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  studentId: z.uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke autentisert.' }, { status: 401 })
  }

  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
    return NextResponse.json({ error: 'Ingen tilgang.' }, { status: 403 })
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig elev-id.' }, { status: 400 })
  }

  const rateResult = rateLimit(`assessment-report:${me.id}`, RATE_LIMITS.examGrading)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: `For mange forespørsler. Prøv igjen om ${rateResult.retryAfterSeconds} sekunder.` },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfterSeconds) } },
    )
  }

  const { studentId } = parsed.data

  if (me.role === 'teacher') {
    const { data: membership } = await supabase
      .from('class_memberships')
      .select('id, classes!inner(id)')
      .eq('student_id', studentId)
      .eq('classes.teacher_id', me.id)
      .limit(1)

    if (!membership?.length) {
      return NextResponse.json({ error: 'Du har ikke tilgang til denne eleven.' }, { status: 403 })
    }
  }

  const [{ data: studentProfile }, { data: examRows }, { count: activityCount }, { count: conversationCount }] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('current_subject, goals, mastered_competency_goals, struggling_competency_goals, total_exercises_completed, total_time_spent_minutes')
      .eq('id', studentId)
      .single(),
    supabase
      .from('exam_submissions')
      .select('total_score_percent, exams!inner(created_by)')
      .eq('student_id', studentId),
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('user_id', studentId).gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', studentId),
  ])

  if (!studentProfile) {
    return NextResponse.json({ error: 'Fant ikke elevprofil.' }, { status: 404 })
  }

  const filteredExamRows = (examRows ?? []).filter((row) => {
    const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams
    return me.role === 'admin' || exam?.created_by === me.id
  })

  const validScores = filteredExamRows
    .map((row) => (row.total_score_percent == null ? null : Number(row.total_score_percent)))
    .filter((score): score is number => Number.isFinite(score))

  const report = await generateAssessmentReport({
    student: {
      subject: studentProfile.current_subject,
      masteredGoals: (studentProfile.mastered_competency_goals as string[] | null) ?? [],
      strugglingGoals: (studentProfile.struggling_competency_goals as string[] | null) ?? [],
      totalExercisesCompleted: studentProfile.total_exercises_completed ?? 0,
      totalTimeSpentMinutes: studentProfile.total_time_spent_minutes ?? 0,
      targetGrade: Number(studentProfile.goals?.target_grade ?? null) || null,
      focusAreas: typeof studentProfile.goals?.focus_areas === 'string' ? studentProfile.goals.focus_areas : null,
    },
    exams: {
      count: validScores.length,
      averageScorePercent: validScores.length ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length : null,
      latestScores: validScores.slice(0, 5),
    },
    activity: {
      activityLast30Days: activityCount ?? 0,
      chatConversations: conversationCount ?? 0,
      chatMessagesThisWeek: 0,
    },
  })

  return NextResponse.json({ report })
}
