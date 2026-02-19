'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'

const teacherNoteSchema = z.object({
  studentId: z.uuid(),
  content: z.string().max(5000),
})

export async function saveTeacherNote(input: unknown) {
  const parsed = teacherNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig notat.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: 'Ikke autentisert.' }
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
    return { ok: false as const, error: 'Kun lærer/admin kan lagre lærernotater.' }
  }

  if (me.role === 'teacher') {
    const { data: membership } = await supabase
      .from('class_memberships')
      .select('id, classes!inner(id)')
      .eq('student_id', parsed.data.studentId)
      .eq('classes.teacher_id', me.id)
      .limit(1)

    if (!membership?.length) {
      return { ok: false as const, error: 'Du har ikke tilgang til denne eleven.' }
    }
  }

  const { data: existing } = await supabase
    .from('teacher_notes')
    .select('id')
    .eq('teacher_id', me.id)
    .eq('student_id', parsed.data.studentId)
    .eq('note_type', 'manual')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    teacher_id: me.id,
    student_id: parsed.data.studentId,
    note_type: 'manual',
    content: parsed.data.content.trim(),
    updated_at: new Date().toISOString(),
  }

  const result = existing
    ? await supabase.from('teacher_notes').update(payload).eq('id', existing.id)
    : await supabase.from('teacher_notes').insert(payload)

  if (result.error) {
    return { ok: false as const, error: 'Kunne ikke lagre notatet.' }
  }

  revalidatePath(`/laerer/elev/${parsed.data.studentId}`)
  return { ok: true as const }
}
