'use server'

import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { runSm2 } from '@/lib/flashcards/sm2'
import { createClient } from '@/lib/supabase/server'

const rateFlashcardSchema = z.object({
  contentElementId: z.string().uuid(),
  quality: z.number().int().min(0).max(5),
})

export async function rateFlashcard(input: z.input<typeof rateFlashcardSchema>) {
  const profile = await getProfile()
  const parsed = rateFlashcardSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig vurdering av flashcard.' }
  }

  const supabase = await createClient()

  const { data: content, error: contentError } = await supabase
    .from('content_elements')
    .select('id')
    .eq('id', parsed.data.contentElementId)
    .eq('content_type', 'flashcard')
    .eq('status', 'published')
    .single()

  if (contentError || !content) {
    return { ok: false as const, error: 'Fant ikke flashcardet.' }
  }

  const { data: existing } = await supabase
    .from('flashcard_progress')
    .select('id, repetitions, interval_days, ease_factor')
    .eq('user_id', profile.id)
    .eq('content_element_id', parsed.data.contentElementId)
    .maybeSingle()

  const sm2 = runSm2({
    quality: parsed.data.quality,
    repetitions: existing?.repetitions ?? 0,
    intervalDays: existing?.interval_days ?? 1,
    easeFactor: Number(existing?.ease_factor ?? 2.5),
  })

  const payload = {
    user_id: profile.id,
    content_element_id: parsed.data.contentElementId,
    repetitions: sm2.repetitions,
    interval_days: sm2.intervalDays,
    ease_factor: sm2.easeFactor,
    next_review: sm2.nextReviewDate,
    last_reviewed: new Date().toISOString(),
  }

  let writeError: { message?: string } | null = null

  if (existing) {
    const { error } = await supabase.from('flashcard_progress').update(payload).eq('id', existing.id)
    writeError = error
  } else {
    const { error } = await supabase.from('flashcard_progress').insert(payload)
    writeError = error
  }

  if (writeError) {
    return { ok: false as const, error: 'Kunne ikke lagre flashcard-progresjon.' }
  }

  return {
    ok: true as const,
    nextReviewDate: sm2.nextReviewDate,
  }
}
