'use server'

import { createClient } from '@/lib/supabase/server'

interface DeleteAccountResult {
  ok: boolean
  error?: string
}

export async function deleteOwnAccount(): Promise<DeleteAccountResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { ok: false, error: 'Ikke innlogget' }
    }

    // Requires service-role admin endpoint in production.
    // This is a soft placeholder for MVP workflow.
    const { error } = await supabase.from('profiles').update({ deactivated_at: new Date().toISOString() }).eq('id', user.id)

    if (error) {
      return { ok: false, error: 'Kunne ikke deaktivere konto' }
    }

    await supabase.auth.signOut()

    return { ok: true }
  } catch {
    return { ok: false, error: 'Uventet feil ved kontosletting' }
  }
}
