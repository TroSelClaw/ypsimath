import { createClient } from '@/lib/supabase/server'

const COMPETENCY_GOALS = [
  'R1-01',
  'R1-02',
  'R1-03',
  'R1-04',
  'R1-05',
  'R1-06',
  'R1-07',
  'R1-08',
  'R1-09',
  'R1-10',
  'R1-11',
  'R1-12',
] as const

type DashboardStudent = {
  id: string
  name: string
  email: string
  masteredGoals: string[]
  strugglingGoals: string[]
  masteryByGoal: Record<string, number>
  completionPercent: number
  behindByTopics: number
}

export type DashboardData = {
  classId: string | null
  className: string | null
  goals: readonly string[]
  students: DashboardStudent[]
  alerts: {
    struggling: DashboardStudent[]
    behindPlan: DashboardStudent[]
  }
  summary: {
    averageCompletionPercent: number
    mostStruggledGoal: string | null
    mostMasteredGoal: string | null
  }
}

function toFrequencyMap(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}

function mostFrequentGoal(goalFrequency: Record<string, number>): string | null {
  const sorted = Object.entries(goalFrequency).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export async function getTeacherDashboardData(teacherId: string): Promise<DashboardData> {
  const supabase = await createClient()

  const { data: classRows } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeClass = classRows?.[0]
  if (!activeClass) {
    return {
      classId: null,
      className: null,
      goals: COMPETENCY_GOALS,
      students: [],
      alerts: { struggling: [], behindPlan: [] },
      summary: {
        averageCompletionPercent: 0,
        mostStruggledGoal: null,
        mostMasteredGoal: null,
      },
    }
  }

  const { data: memberships } = await supabase
    .from('class_memberships')
    .select('student_id, profiles!inner(id, display_name, email), student_profiles!inner(mastered_competency_goals, struggling_competency_goals)')
    .eq('class_id', activeClass.id)

  const studentIds = (memberships ?? []).map((row) => row.student_id)

  const [{ data: planRows }, { data: activityRows }] = await Promise.all([
    supabase
      .from('semester_plans')
      .select('id')
      .eq('class_id', activeClass.id)
      .order('created_at', { ascending: false })
      .limit(1),
    studentIds.length
      ? supabase
          .from('activity_log')
          .select('user_id, topic')
          .in('user_id', studentIds)
          .eq('activity_type', 'exercise_attempt')
          .not('topic', 'is', null)
      : Promise.resolve({ data: [] as { user_id: string; topic: string | null }[] }),
  ])

  let plannedTopics = 0
  const latestPlanId = planRows?.[0]?.id
  if (latestPlanId) {
    const now = new Date().toISOString().slice(0, 10)
    const { count } = await supabase
      .from('semester_plan_entries')
      .select('id', { count: 'exact', head: true })
      .eq('semester_plan_id', latestPlanId)
      .eq('entry_type', 'topic')
      .lte('date', now)

    plannedTopics = count ?? 0
  }

  const topicProgressByUser = (activityRows ?? []).reduce<Record<string, Set<string>>>((acc, row) => {
    if (!row.topic) return acc
    if (!acc[row.user_id]) acc[row.user_id] = new Set<string>()
    acc[row.user_id].add(row.topic)
    return acc
  }, {})

  const students: DashboardStudent[] = (memberships ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const studentProfile = Array.isArray(row.student_profiles) ? row.student_profiles[0] : row.student_profiles

    const masteredGoals = (studentProfile?.mastered_competency_goals as string[] | null) ?? []
    const strugglingGoals = (studentProfile?.struggling_competency_goals as string[] | null) ?? []

    const masteryByGoal = COMPETENCY_GOALS.reduce<Record<string, number>>((acc, goal) => {
      if (masteredGoals.includes(goal)) acc[goal] = 100
      else if (strugglingGoals.includes(goal)) acc[goal] = 25
      else acc[goal] = 65
      return acc
    }, {})

    const completionPercent = clamp(Math.round((masteredGoals.length / COMPETENCY_GOALS.length) * 100), 0, 100)
    const completedTopics = topicProgressByUser[row.student_id]?.size ?? 0

    return {
      id: row.student_id,
      name: profile?.display_name ?? 'Ukjent elev',
      email: profile?.email ?? '—',
      masteredGoals,
      strugglingGoals,
      masteryByGoal,
      completionPercent,
      behindByTopics: Math.max(0, plannedTopics - completedTopics),
    }
  })

  const struggledFrequency = toFrequencyMap(students.flatMap((student) => student.strugglingGoals))
  const masteredFrequency = toFrequencyMap(students.flatMap((student) => student.masteredGoals))

  const averageCompletionPercent = students.length
    ? Math.round(students.reduce((sum, student) => sum + student.completionPercent, 0) / students.length)
    : 0

  return {
    classId: activeClass.id,
    className: activeClass.name,
    goals: COMPETENCY_GOALS,
    students,
    alerts: {
      struggling: students.filter((student) => student.strugglingGoals.length > 3),
      behindPlan: students.filter((student) => student.behindByTopics > 2),
    },
    summary: {
      averageCompletionPercent,
      mostStruggledGoal: mostFrequentGoal(struggledFrequency),
      mostMasteredGoal: mostFrequentGoal(masteredFrequency),
    },
  }
}
