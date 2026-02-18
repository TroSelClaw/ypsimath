'use server'

import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { logActivity as logActivityInternal } from '@/lib/progress/tracker'

const logActivitySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum(['wiki_view', 'exercise_attempt', 'chat_message', 'exam_graded', 'video_watched', 'flashcard_session']),
  subjectId: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  competencyGoals: z.array(z.string()).optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function logActivity(input: z.input<typeof logActivitySchema>) {
  const profile = await getProfile()
  const parsed = logActivitySchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig aktivitetsdata.' }
  }

  const userId = parsed.data.userId ?? profile.id
  if (profile.role === 'student' && userId !== profile.id) {
    return { ok: false as const, error: 'Du kan bare logge aktivitet for deg selv.' }
  }

  try {
    await logActivityInternal({
      userId,
      type: parsed.data.type,
      subjectId: parsed.data.subjectId,
      topic: parsed.data.topic,
      competencyGoals: parsed.data.competencyGoals,
      durationSeconds: parsed.data.durationSeconds,
      metadata: parsed.data.metadata,
    })

    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Kunne ikke logge aktivitet.',
    }
  }
}
