'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin() {
  await requireRole(['admin'])
}

export async function updateContentStatus(formData: FormData) {
  await assertAdmin()
  const supabase = await createClient()
  const profile = await requireRole(['admin'])

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')

  if (!id || !['draft', 'flagged', 'reviewed', 'published'].includes(status)) {
    throw new Error('Ugyldig input')
  }

  const patch: Record<string, unknown> = { status }
  if (status === 'reviewed') {
    patch.reviewed_by = profile.id
    patch.reviewed_at = new Date().toISOString()
  }

  const { error } = await supabase.from('content_elements').update(patch).eq('id', id)
  if (error) throw error

  revalidatePath('/admin/innhold')
}

export async function saveContentEdit(formData: FormData) {
  await assertAdmin()
  const supabase = await createClient()
  const profile = await requireRole(['admin'])

  const id = String(formData.get('id') ?? '')
  const content = String(formData.get('content') ?? '')
  const changeNote = String(formData.get('changeNote') ?? 'Inline edit from content review dashboard')

  if (!id || !content.trim()) {
    throw new Error('Mangler innhold')
  }

  const { data: current, error: fetchError } = await supabase
    .from('content_elements')
    .select('id, content, version')
    .eq('id', id)
    .single()

  if (fetchError || !current) throw fetchError ?? new Error('Fant ikke innholdselement')

  const { error: versionError } = await supabase.from('content_versions').insert({
    content_element_id: id,
    version: current.version,
    content: current.content,
    changed_by: profile.id,
    change_note: changeNote,
  })
  if (versionError) throw versionError

  const { error: updateError } = await supabase
    .from('content_elements')
    .update({
      content,
      version: current.version + 1,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) throw updateError

  revalidatePath('/admin/innhold')
}

export async function publishAllReviewed() {
  await assertAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('content_elements')
    .update({ status: 'published' })
    .eq('status', 'reviewed')

  if (error) throw error

  revalidatePath('/admin/innhold')
}
