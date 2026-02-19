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
  const contentType = String(formData.get('contentType') ?? '')
  const changeNote = String(formData.get('changeNote') ?? 'Inline edit from content review dashboard')

  const allowedTypes = ['theory', 'rule', 'example', 'exercise', 'exploration', 'flashcard']

  if (!id || !content.trim() || !allowedTypes.includes(contentType)) {
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
      content_type: contentType,
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
  revalidatePath('/laerer/innhold')
}

export async function quickReviewFlagged(formData: FormData) {
  await assertAdmin()
  const supabase = await createClient()
  const profile = await requireRole(['admin'])

  const id = String(formData.get('id') ?? '')
  const actionType = String(formData.get('actionType') ?? '')

  if (!id || !['approve', 'reject'].includes(actionType)) {
    throw new Error('Ugyldig input')
  }

  const patch: Record<string, unknown> = {
    status: actionType === 'approve' ? 'reviewed' : 'draft',
    reviewed_by: profile.id,
    reviewed_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('content_elements').update(patch).eq('id', id).eq('status', 'flagged')
  if (error) throw error

  revalidatePath('/admin/innhold')
  revalidatePath('/admin/innhold/flagget')
  revalidatePath('/laerer/innhold')
  revalidatePath('/laerer')
}

export async function flagContentForReview(formData: FormData) {
  const profile = await requireRole(['teacher', 'admin'])
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const comment = String(formData.get('comment') ?? '').trim()

  if (!id || comment.length < 8) {
    throw new Error('Kommentaren må være minst 8 tegn')
  }

  const { data: current, error: fetchError } = await supabase
    .from('content_elements')
    .select('id,content_metadata')
    .eq('id', id)
    .single()

  if (fetchError || !current) throw fetchError ?? new Error('Fant ikke innholdselement')

  const currentMetadata = (current.content_metadata as Record<string, unknown> | null) ?? {}

  const { error } = await supabase
    .from('content_elements')
    .update({
      status: 'flagged',
      content_metadata: {
        ...currentMetadata,
        flag_reason: comment,
        flag_source: 'teacher',
        flag_comment_author: profile.id,
        flagged_at: new Date().toISOString(),
      },
    })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/laerer/innhold')
  revalidatePath('/admin/innhold')
  revalidatePath('/admin/innhold/flagget')
  revalidatePath('/laerer')
}
