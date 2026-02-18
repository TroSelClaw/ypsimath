'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { createClassInputSchema } from '@/lib/schemas'

export type ClassActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createClass(
  _prev: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const profile = await getProfile()
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { error: 'Du har ikke tilgang til å opprette klasser.' }
  }

  const raw = {
    name: formData.get('name') as string,
    subject_id: formData.get('subject_id') as string,
    school_year: formData.get('school_year') as string,
  }

  const result = createClassInputSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = []
      fieldErrors[key].push(issue.message)
    }
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('classes').insert({
    name: result.data.name,
    subject_id: result.data.subject_id,
    teacher_id: profile.id,
    school_year: result.data.school_year,
  })

  if (error) {
    return { error: 'Kunne ikke opprette klassen. Prøv igjen.' }
  }

  redirect('/laerer')
}

export async function addStudentToClass(classId: string, studentEmail: string) {
  const profile = await getProfile()
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { error: 'Ingen tilgang.' }
  }

  const supabase = await createClient()

  // Find student by email
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', studentEmail)
    .eq('role', 'student')
    .single()

  if (!student) {
    return { error: 'Fant ingen elev med denne e-postadressen.' }
  }

  const { error } = await supabase.from('class_memberships').insert({
    class_id: classId,
    student_id: student.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Eleven er allerede i klassen.' }
    }
    return { error: 'Kunne ikke legge til eleven. Prøv igjen.' }
  }

  return { success: true }
}
