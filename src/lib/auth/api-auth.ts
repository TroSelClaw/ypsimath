import { AuthError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

export async function requireApiUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('Ikke autentisert.')
  }

  return { supabase, user }
}
