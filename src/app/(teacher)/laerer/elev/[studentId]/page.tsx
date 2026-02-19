import { notFound } from 'next/navigation'
import { StudentDetail } from '@/components/dashboard/student-detail'
import { requireRole } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ studentId: string }>
}

export default async function TeacherStudentDetailPage({ params }: PageProps) {
  const profile = await requireRole(['teacher', 'admin'])
  const { studentId } = await params
  const supabase = await createClient()

  const membershipQuery = supabase
    .from('class_memberships')
    .select('class_id, classes!inner(id, name, teacher_id)')
    .eq('student_id', studentId)

  if (profile.role === 'teacher') {
    membershipQuery.eq('classes.teacher_id', profile.id)
  }

  const { data: memberships } = await membershipQuery.limit(1)
  const membership = memberships?.[0]

  if (!membership) {
    notFound()
  }

  const classRow = Array.isArray(membership.classes) ? membership.classes[0] : membership.classes

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [{ data: student }, { data: studentProfile }, { data: activityRows }, { data: notes }, { count: conversationCount }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email').eq('id', studentId).single(),
    supabase
      .from('student_profiles')
      .select('current_subject, goals, learning_style_prefs, mastered_competency_goals, struggling_competency_goals, total_exercises_completed, total_time_spent_minutes')
      .eq('id', studentId)
      .single(),
    supabase
      .from('activity_log')
      .select('id, activity_type, topic, created_at')
      .eq('user_id', studentId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(120),
    supabase
      .from('teacher_notes')
      .select('content, note_type, updated_at')
      .eq('teacher_id', profile.id)
      .eq('student_id', studentId)
      .in('note_type', ['manual', 'ai_report'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', studentId),
  ])

  const latestManual = notes?.find((note) => note.note_type === 'manual')
  const latestAiReport = notes?.find((note) => note.note_type === 'ai_report')

  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('id, total_score_percent, exams!inner(id, title, created_at, created_by)')
    .eq('student_id', studentId)
    .order('id', { ascending: false })

  const filteredSubmissions = (submissions ?? []).filter((row) => {
    const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams
    return profile.role === 'admin' || exam?.created_by === profile.id
  })

  const examEntries = filteredSubmissions.map((row) => {
    const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams
    return {
      submissionId: row.id,
      examId: exam.id,
      title: exam.title,
      createdAt: exam.created_at,
      scorePercent: row.total_score_percent == null ? null : Number(row.total_score_percent),
    }
  })

  const { data: conversationRows } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', studentId)

  const conversationIds = (conversationRows ?? []).map((conversation) => conversation.id)

  const messagesThisWeek = conversationIds.length
    ? (await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .gte('created_at', weekAgo.toISOString())).count ?? 0
    : 0

  if (!student || !studentProfile) {
    notFound()
  }

  return (
    <StudentDetail
      className={classRow?.name ?? 'Klasse'}
      student={{
        id: student.id,
        name: student.display_name,
        email: student.email,
        currentSubject: studentProfile.current_subject,
        goals: (studentProfile.goals as { target_grade?: number; focus_areas?: string } | null) ?? {},
        learningStylePrefs: (studentProfile.learning_style_prefs as Record<string, unknown> | null) ?? {},
        masteredGoals: (studentProfile.mastered_competency_goals as string[] | null) ?? [],
        strugglingGoals: (studentProfile.struggling_competency_goals as string[] | null) ?? [],
        totalExercisesCompleted: studentProfile.total_exercises_completed ?? 0,
        totalTimeSpentMinutes: studentProfile.total_time_spent_minutes ?? 0,
      }}
      timeline={(activityRows ?? []).map((row) => ({
        id: row.id,
        activityType: row.activity_type,
        topic: row.topic,
        createdAt: row.created_at,
      }))}
      exams={examEntries}
      chatSummary={{
        conversations: conversationCount ?? 0,
        messagesThisWeek,
      }}
      initialTeacherNote={latestManual?.content ?? ''}
      initialAssessmentReport={latestAiReport?.content ?? ''}
    />
  )
}
