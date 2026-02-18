import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { logActivity } from '@/lib/progress/tracker'

const activityPayloadSchema = z.object({
  type: z.enum(['wiki_view', 'exercise_attempt', 'chat_message', 'exam_graded', 'video_watched', 'flashcard_session']),
  subjectId: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  competencyGoals: z.array(z.string()).optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    const profile = await getProfile()
    const body = await request.json()
    const parsed = activityPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Ugyldig payload' }, { status: 400 })
    }

    await logActivity({
      userId: profile.id,
      type: parsed.data.type,
      subjectId: parsed.data.subjectId,
      topic: parsed.data.topic,
      competencyGoals: parsed.data.competencyGoals,
      durationSeconds: parsed.data.durationSeconds,
      metadata: parsed.data.metadata,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Kunne ikke logge aktivitet' }, { status: 500 })
  }
}
