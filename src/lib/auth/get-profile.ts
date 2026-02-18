import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Role } from '@/lib/schemas'

export interface UserProfile {
  id: string
  email: string
  display_name: string
  role: Role
  settings: Record<string, unknown> | null
}

/**
 * Get the current user's profile. Redirects to /logg-inn if not authenticated.
 */
export async function getProfile(): Promise<UserProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/logg-inn')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, settings')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/logg-inn')
  }

  return profile as UserProfile
}

/**
 * Require a specific role. Redirects to the user's home if role doesn't match.
 */
export async function requireRole(allowedRoles: Role[]): Promise<UserProfile> {
  const profile = await getProfile()

  if (!allowedRoles.includes(profile.role)) {
    // Redirect to their own home
    const homeMap: Record<Role, string> = {
      student: '/wiki',
      teacher: '/laerer',
      admin: '/admin',
    }
    redirect(homeMap[profile.role] ?? '/')
  }

  return profile
}
