'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'

const overrideSchema = z.object({
  examId: z.uuid(),
  answerId: z.uuid(),
  newScorePercent: z.number().min(0).max(100),
})

export async function overrideExamAnswerScore(input: unknown) {
  const parsed = overrideSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Ugyldig inndata for overstyring.' }
  }

  const { examId, answerId, newScorePercent } = parsed.data
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Ikke autentisert.' }

  const { data: exam } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('created_by', user.id)
    .single()

  if (!exam) return { error: 'Fant ikke prøven.' }

  const { data: answer, error: answerError } = await supabase
    .from('exam_answers')
    .select('id, submission_id, question_id')
    .eq('id', answerId)
    .single()

  if (answerError || !answer) return { error: 'Fant ikke besvarelsen.' }

  const { error: updateError } = await supabase
    .from('exam_answers')
    .update({
      score_percent: newScorePercent,
      teacher_override: true,
    })
    .eq('id', answerId)

  if (updateError) return { error: 'Kunne ikke lagre overstyring.' }

  // Recalculate submission total based on weighted question max_points
  const { data: submissionAnswers } = await supabase
    .from('exam_answers')
    .select('score_percent, question_id')
    .eq('submission_id', answer.submission_id)

  if (submissionAnswers && submissionAnswers.length > 0) {
    const questionIds = submissionAnswers.map((a) => a.question_id)
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('id, max_points')
      .in('id', questionIds)

    if (questions && questions.length > 0) {
      const questionMap = new Map(questions.map((q) => [q.id, Number(q.max_points)]))
      let totalMax = 0
      let totalEarned = 0

      for (const a of submissionAnswers) {
        const maxPoints = questionMap.get(a.question_id) ?? 0
        totalMax += maxPoints
        totalEarned += (maxPoints * Number(a.score_percent ?? 0)) / 100
      }

      const totalPercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0

      await supabase
        .from('exam_submissions')
        .update({ total_score_percent: totalPercent })
        .eq('id', answer.submission_id)
    }
  }

  revalidatePath(`/laerer/prover/${examId}/resultater`)
  return { success: true }
}
