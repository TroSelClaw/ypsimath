import { createClient } from '@/lib/supabase/server'

export type LogActivityInput = {
  userId: string
  type: 'wiki_view' | 'exercise_attempt' | 'chat_message' | 'exam_graded' | 'video_watched' | 'flashcard_session'
  subjectId?: string | null
  topic?: string | null
  competencyGoals?: string[]
  durationSeconds?: number | null
  metadata?: Record<string, unknown>
}

async function recomputeStudentCompetencies(userId: string) {
  const supabase = await createClient()

  const { data: attempts } = await supabase
    .from('exercise_attempts')
    .select('auto_result, self_report, content_elements!inner(competency_goals)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(120)

  const goalStats = new Map<string, { success: number; fail: number }>()

  for (const attempt of attempts ?? []) {
    const goals = ((attempt.content_elements as { competency_goals?: string[] } | null)?.competency_goals ?? []) as string[]
    const success = attempt.auto_result === true || attempt.self_report === 'correct'
    const fail = attempt.auto_result === false || attempt.self_report === 'incorrect'

    for (const goal of goals) {
      const current = goalStats.get(goal) ?? { success: 0, fail: 0 }
      goalStats.set(goal, {
        success: current.success + (success ? 1 : 0),
        fail: current.fail + (fail ? 1 : 0),
      })
    }
  }

  const mastered = [...goalStats.entries()]
    .filter(([, stat]) => stat.success >= 3)
    .map(([goal]) => goal)

  const struggling = [...goalStats.entries()]
    .filter(([, stat]) => stat.fail >= 3 && stat.success < 3)
    .map(([goal]) => goal)

  await supabase
    .from('student_profiles')
    .update({
      mastered_competency_goals: mastered,
      struggling_competency_goals: struggling,
    })
    .eq('id', userId)
}

export async function logActivity(input: LogActivityInput) {
  const supabase = await createClient()

  const { error } = await supabase.from('activity_log').insert({
    user_id: input.userId,
    activity_type: input.type,
    subject_id: input.subjectId ?? null,
    topic: input.topic ?? null,
    competency_goals: input.competencyGoals ?? [],
    metadata: input.metadata ?? {},
    duration_seconds: input.durationSeconds ?? null,
  })

  if (error) {
    throw new Error('Kunne ikke logge aktivitet.')
  }

  if (input.type === 'exercise_attempt') {
    const incrementMinutes = Math.max(0, Math.round((input.durationSeconds ?? 0) / 60))

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('total_exercises_completed, total_time_spent_minutes')
      .eq('id', input.userId)
      .single()

    if (studentProfile) {
      await supabase
        .from('student_profiles')
        .update({
          total_exercises_completed: (studentProfile.total_exercises_completed ?? 0) + 1,
          total_time_spent_minutes: (studentProfile.total_time_spent_minutes ?? 0) + incrementMinutes,
        })
        .eq('id', input.userId)
    }

    await recomputeStudentCompetencies(input.userId)
  }
}
