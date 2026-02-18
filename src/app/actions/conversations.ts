'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

const renameSchema = z.object({
  conversationId: z.uuid(),
  title: z.string().min(1).max(200),
})

const deleteSchema = z.object({
  conversationId: z.uuid(),
})

export async function renameConversation(formData: FormData) {
  const parsed = renameSchema.safeParse({
    conversationId: formData.get('conversationId'),
    title: formData.get('title'),
  })

  if (!parsed.success) {
    return { error: 'Ugyldig tittel.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Ikke autentisert.' }

  const { error } = await supabase
    .from('conversations')
    .update({ title: parsed.data.title })
    .eq('id', parsed.data.conversationId)
    .eq('student_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: 'Kunne ikke endre navn.' }

  revalidatePath('/chat', 'layout')
  return { success: true }
}

export async function deleteConversation(formData: FormData) {
  const parsed = deleteSchema.safeParse({
    conversationId: formData.get('conversationId'),
  })

  if (!parsed.success) {
    return { error: 'Ugyldig samtale.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Ikke autentisert.' }

  const { error } = await supabase
    .from('conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', parsed.data.conversationId)
    .eq('student_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: 'Kunne ikke slette samtalen.' }

  revalidatePath('/chat', 'layout')
  return { success: true }
}
