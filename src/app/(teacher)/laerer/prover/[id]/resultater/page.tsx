import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamResultsView } from '@/components/exams/exam-results-view'
import type { StudentResult } from '@/components/exams/results-table'
import type { AnswerDetail } from '@/components/exams/student-result-detail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExamResultsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, created_by')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!exam) return notFound()

  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('id, student_id, total_score_percent, status')
    .eq('exam_id', id)

  if (!submissions || submissions.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Resultater: {exam.title}</h1>
        <p className="text-muted-foreground">Ingen innleveringer funnet ennå.</p>
      </div>
    )
  }

  const studentIds = [...new Set(submissions.map((s) => s.student_id))]
  const submissionIds = submissions.map((s) => s.id)

  const [{ data: profiles }, { data: answers }, { data: questions }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email').in('id', studentIds),
    supabase
      .from('exam_answers')
      .select('id, submission_id, question_id, student_answer_text, score_percent, confidence_score, error_analysis, llm_feedback, teacher_override')
      .in('submission_id', submissionIds),
    supabase
      .from('exam_questions')
      .select('id, part, question_number, content, max_points')
      .eq('exam_id', id),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]))
  const answersBySubmission = new Map<string, typeof answers>()

  for (const answer of answers ?? []) {
    const list = answersBySubmission.get(answer.submission_id) ?? []
    list.push(answer)
    answersBySubmission.set(answer.submission_id, list)
  }

  const detailsBySubmission: Record<string, { studentName: string; totalScorePercent: number; answers: AnswerDetail[] }> = {}

  const results: StudentResult[] = submissions.map((s) => {
    const student = profileMap.get(s.student_id)
    const submissionAnswers = answersBySubmission.get(s.id) ?? []

    const withQuestion = submissionAnswers
      .map((a) => {
        const q = questionMap.get(a.question_id)
        if (!q) return null
        return { a, q }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    const part1 = withQuestion.filter((x) => x.q.part === 1)
    const part2 = withQuestion.filter((x) => x.q.part === 2)

    const partScore = (rows: typeof withQuestion) => {
      if (rows.length === 0) return null
      const max = rows.reduce((sum, r) => sum + Number(r.q.max_points), 0)
      const earned = rows.reduce(
        (sum, r) => sum + (Number(r.q.max_points) * Number(r.a.score_percent ?? 0)) / 100,
        0,
      )
      return max > 0 ? Math.round((earned / max) * 100) : null
    }

    const avgConfidence =
      withQuestion.length > 0
        ? Math.round(
            withQuestion.reduce((sum, r) => sum + Number(r.a.confidence_score ?? 0), 0) /
              withQuestion.length,
          )
        : null

    detailsBySubmission[s.id] = {
      studentName: student?.display_name ?? student?.email ?? 'Ukjent elev',
      totalScorePercent: Number(s.total_score_percent ?? 0),
      answers: withQuestion
        .map(({ a, q }) => ({
          answerId: a.id,
          questionId: q.id,
          part: q.part,
          questionNumber: q.question_number,
          questionContent: q.content,
          maxPoints: Number(q.max_points),
          studentAnswerText: a.student_answer_text ?? '',
          scorePercent: Number(a.score_percent ?? 0),
          confidenceScore: Number(a.confidence_score ?? 0),
          errorAnalysis: {
            fortegnsfeil: Boolean((a.error_analysis as Record<string, unknown> | null)?.fortegnsfeil),
            konseptfeil: Boolean((a.error_analysis as Record<string, unknown> | null)?.konseptfeil),
            regnefeil: Boolean((a.error_analysis as Record<string, unknown> | null)?.regnefeil),
            manglende_steg: Boolean((a.error_analysis as Record<string, unknown> | null)?.manglende_steg),
            details: String((a.error_analysis as Record<string, unknown> | null)?.details ?? ''),
          },
          llmFeedback: a.llm_feedback ?? '',
          teacherOverride: Boolean(a.teacher_override),
        }))
        .sort((a, b) => (a.part - b.part) || (a.questionNumber - b.questionNumber)),
    }

    return {
      submissionId: s.id,
      studentId: s.student_id,
      studentName: student?.display_name ?? student?.email ?? 'Ukjent elev',
      studentEmail: student?.email ?? '',
      status: s.status,
      totalScorePercent: s.total_score_percent === null ? null : Number(s.total_score_percent),
      part1ScorePercent: partScore(part1),
      part2ScorePercent: partScore(part2),
      avgConfidence,
    }
  })

  results.sort((a, b) => a.studentName.localeCompare(b.studentName, 'nb'))

  return (
    <ExamResultsView
      examId={exam.id}
      title={exam.title}
      initialResults={results}
      detailsBySubmission={detailsBySubmission}
    />
  )
}
