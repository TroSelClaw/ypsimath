'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const roleSchema = z.enum(['student', 'teacher', 'admin'])

async function ensureAdmin() {
  const profile = await getProfile()
  if (profile.role !== 'admin') {
    return { ok: false as const, error: 'Kun admin har tilgang.' }
  }
  return { ok: true as const, adminId: profile.id }
}

async function logAudit(input: {
  adminId: string
  targetUserId: string
  action: string
  details?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('admin_user_audit_log').insert({
    admin_id: input.adminId,
    target_user_id: input.targetUserId,
    action: input.action,
    details: input.details ?? {},
  })
}

export async function updateUserRole(formData: FormData) {
  const access = await ensureAdmin()
  if (!access.ok) return access

  const userId = String(formData.get('userId') ?? '')
  const role = roleSchema.safeParse(formData.get('role'))

  if (!userId || !role.success) {
    return { ok: false as const, error: 'Ugyldig rolleoppdatering.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role: role.data }).eq('id', userId)

  if (error) {
    return { ok: false as const, error: 'Kunne ikke oppdatere rollen.' }
  }

  await logAudit({
    adminId: access.adminId,
    targetUserId: userId,
    action: 'role_change',
    details: { role: role.data },
  })

  revalidatePath('/admin/brukere')
  return { ok: true as const }
}

export async function setUserDeactivated(formData: FormData) {
  const access = await ensureAdmin()
  if (!access.ok) return access

  const userId = String(formData.get('userId') ?? '')
  const deactivate = String(formData.get('deactivate') ?? 'true') === 'true'

  if (!userId) {
    return { ok: false as const, error: 'Ugyldig bruker.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ deactivated_at: deactivate ? new Date().toISOString() : null })
    .eq('id', userId)

  if (error) {
    return { ok: false as const, error: 'Kunne ikke oppdatere brukerstatus.' }
  }

  await logAudit({
    adminId: access.adminId,
    targetUserId: userId,
    action: deactivate ? 'deactivate' : 'reactivate',
  })

  revalidatePath('/admin/brukere')
  return { ok: true as const }
}

export async function deleteUser(formData: FormData) {
  const access = await ensureAdmin()
  if (!access.ok) return access

  const userId = String(formData.get('userId') ?? '')
  const email = String(formData.get('email') ?? '')
  const confirmation = String(formData.get('confirmation') ?? '')

  if (!userId || !email || confirmation !== email) {
    return { ok: false as const, error: 'Bekrefting mislyktes. Skriv brukerens e-post for å slette.' }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.deleteUser(userId)

  if (error) {
    return { ok: false as const, error: 'Kunne ikke slette brukeren.' }
  }

  await logAudit({
    adminId: access.adminId,
    targetUserId: userId,
    action: 'delete',
    details: { email },
  })

  revalidatePath('/admin/brukere')
  return { ok: true as const }
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const [header, ...rows] = lines
  const columns = header.toLowerCase().split(',').map((column) => column.trim())
  const nameIndex = columns.indexOf('name')
  const emailIndex = columns.indexOf('email')

  if (nameIndex === -1 || emailIndex === -1) {
    throw new Error('CSV må ha kolonnene name,email')
  }

  return rows
    .map((row) => row.split(',').map((value) => value.trim()))
    .filter((values) => values[emailIndex])
    .map((values) => ({
      name: values[nameIndex] ?? '',
      email: values[emailIndex] ?? '',
    }))
}

export async function importUsersFromCsv(formData: FormData) {
  const access = await ensureAdmin()
  if (!access.ok) return access

  const file = formData.get('csv')
  if (!(file instanceof File)) {
    return { ok: false as const, error: 'Mangler CSV-fil.' }
  }

  const text = await file.text()

  let rows: Array<{ name: string; email: string }>
  try {
    rows = parseCsv(text)
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Ugyldig CSV.' }
  }

  if (!rows.length) {
    return { ok: false as const, error: 'CSV-filen inneholder ingen brukere.' }
  }

  const adminSupabase = createAdminClient()

  let invited = 0
  let failed = 0

  for (const row of rows) {
    const email = row.email.toLowerCase()

    const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: row.name || email.split('@')[0],
        role: 'student',
      },
    })

    if (error) {
      failed += 1
      continue
    }

    invited += 1
  }

  await logAudit({
    adminId: access.adminId,
    targetUserId: access.adminId,
    action: 'bulk_invite',
    details: { invited, failed, total: rows.length },
  })

  revalidatePath('/admin/brukere')

  if (failed > 0) {
    return {
      ok: false as const,
      error: `Inviterte ${invited} brukere. ${failed} feilet (eksisterende konto eller ugyldig e-post).`,
    }
  }

  return { ok: true as const, message: `Inviterte ${invited} brukere.` }
}
