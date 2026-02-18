'use server'

import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/progress/tracker'

const recordExerciseAttemptSchema = z.object({
  contentElementId: z.string().uuid(),
  checkMethod: z.enum(['self_report', 'auto_check', 'image_check']),
  selfReport: z.enum(['correct', 'partial', 'incorrect']).optional(),
  autoResult: z.boolean().optional(),
  answer: z.string().optional(),
  imageUrl: z.string().optional(),
  imageFeedback: z.string().optional(),
  hintsUsed: z.number().int().min(0).default(0),
  viewedSolution: z.boolean().default(false),
  timeSeconds: z.number().int().min(0).optional(),
})

export async function recordExerciseAttempt(input: z.input<typeof recordExerciseAttemptSchema>) {
  const profile = await getProfile()
  const parsed = recordExerciseAttemptSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig data for oppgaveforsøk.' }
  }

  const supabase = await createClient()

  const { data: content } = await supabase
    .from('content_elements')
    .select('subject_id, topic, competency_goals')
    .eq('id', parsed.data.contentElementId)
    .single()

  const { error: attemptError } = await supabase.from('exercise_attempts').insert({
    user_id: profile.id,
    content_element_id: parsed.data.contentElementId,
    check_method: parsed.data.checkMethod,
    self_report: parsed.data.selfReport,
    auto_result: parsed.data.autoResult,
    answer: parsed.data.answer,
    image_url: parsed.data.imageUrl,
    image_feedback: parsed.data.imageFeedback,
    hints_used: parsed.data.hintsUsed,
    viewed_solution: parsed.data.viewedSolution,
    time_seconds: parsed.data.timeSeconds,
  })

  if (attemptError) {
    return { ok: false as const, error: 'Kunne ikke lagre oppgaveforsøket.' }
  }

  await logActivity({
    userId: profile.id,
    type: 'exercise_attempt',
    subjectId: content?.subject_id ?? null,
    topic: content?.topic ?? null,
    competencyGoals: Array.isArray(content?.competency_goals) ? content.competency_goals : [],
    durationSeconds: parsed.data.timeSeconds,
    metadata: {
      content_element_id: parsed.data.contentElementId,
      check_method: parsed.data.checkMethod,
      self_report: parsed.data.selfReport,
      auto_result: parsed.data.autoResult,
      viewed_solution: parsed.data.viewedSolution,
      hints_used: parsed.data.hintsUsed,
      image_url: parsed.data.imageUrl,
      image_feedback: parsed.data.imageFeedback,
    },
  })

  return { ok: true as const }
}
