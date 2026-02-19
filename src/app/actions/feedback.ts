'use server'

import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

const feedbackSchema = z.object({
  score: z.coerce.number().int().min(0).max(10),
  comment: z.string().trim().max(1200).optional(),
  pagePath: z.string().trim().max(500).optional(),
})

export async function submitFeedback(input: z.input<typeof feedbackSchema>) {
  const parsed = feedbackSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig tilbakemelding.' }
  }

  const profile = await getProfile()
  const supabase = await createClient()

  const { error } = await supabase.from('user_feedback').insert({
    user_id: profile.id,
    role: profile.role,
    score: parsed.data.score,
    comment: parsed.data.comment || null,
    page_path: parsed.data.pagePath || null,
  })

  if (error) {
    return { ok: false as const, error: 'Kunne ikke lagre tilbakemelding akkurat nå.' }
  }

  return { ok: true as const }
}
