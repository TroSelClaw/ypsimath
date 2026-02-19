'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'

const teacherNoteSchema = z.object({
  studentId: z.uuid(),
  content: z.string().max(5000),
})

async function ensureTeacherAccess(studentId: string) {
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
      .eq('student_id', studentId)
      .eq('classes.teacher_id', me.id)
      .limit(1)

    if (!membership?.length) {
      return { ok: false as const, error: 'Du har ikke tilgang til denne eleven.' }
    }
  }

  return { ok: true as const, supabase, teacherId: me.id }
}

async function upsertTeacherNote(input: { studentId: string; content: string; noteType: 'manual' | 'ai_report' }) {
  const access = await ensureTeacherAccess(input.studentId)
  if (!access.ok) return access

  const { supabase, teacherId } = access

  const { data: existing } = await supabase
    .from('teacher_notes')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('student_id', input.studentId)
    .eq('note_type', input.noteType)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    teacher_id: teacherId,
    student_id: input.studentId,
    note_type: input.noteType,
    content: input.content.trim(),
    updated_at: new Date().toISOString(),
  }

  const result = existing
    ? await supabase.from('teacher_notes').update(payload).eq('id', existing.id)
    : await supabase.from('teacher_notes').insert(payload)

  if (result.error) {
    return { ok: false as const, error: 'Kunne ikke lagre notatet.' }
  }

  revalidatePath(`/laerer/elev/${input.studentId}`)
  return { ok: true as const }
}

export async function saveTeacherNote(input: unknown) {
  const parsed = teacherNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig notat.' }
  }

  return upsertTeacherNote({
    studentId: parsed.data.studentId,
    content: parsed.data.content,
    noteType: 'manual',
  })
}

export async function saveAiAssessmentReport(input: unknown) {
  const parsed = teacherNoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Ugyldig rapport.' }
  }

  return upsertTeacherNote({
    studentId: parsed.data.studentId,
    content: parsed.data.content,
    noteType: 'ai_report',
  })
}
