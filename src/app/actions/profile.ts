'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

const goalsSchema = z.object({
  targetGrade: z.coerce.number().int().min(1).max(6),
  focusAreas: z.string().max(1000).optional(),
})

export async function saveStudentGoals(input: z.input<typeof goalsSchema>) {
  const profile = await getProfile()
  if (profile.role !== 'student') {
    return { ok: false as const, error: 'Kun elever kan oppdatere egne mål.' }
  }

  const parsed = goalsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldige mål. Sjekk karakter og tekst.' }
  }

  const supabase = await createClient()

  const goals = {
    target_grade: parsed.data.targetGrade,
    focus_areas: parsed.data.focusAreas?.trim() ?? '',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({ goals })
    .eq('id', profile.id)

  if (error) {
    return { ok: false as const, error: 'Kunne ikke lagre mål akkurat nå.' }
  }

  revalidatePath('/profil')
  return { ok: true as const }
}
