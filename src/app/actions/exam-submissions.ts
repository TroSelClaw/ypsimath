'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

const pageRangeSchema = z.object({
  studentId: z.uuid(),
  startPage: z.number().int().min(1),
  endPage: z.number().int().min(1),
})

const startGradingSchema = z.object({
  examId: z.uuid(),
  scanPath: z.string().min(1),
  mappings: z.array(pageRangeSchema).min(1),
})

export async function startExamGrading(input: unknown) {
  const parsed = startGradingSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Ugyldig inndata for retting.' }
  }

  const { examId, scanPath, mappings } = parsed.data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Ikke autentisert.' }

  const { data: exam } = await supabase
    .from('exams')
    .select('id, created_by')
    .eq('id', examId)
    .eq('created_by', user.id)
    .single()

  if (!exam) return { error: 'Fant ikke prøven.' }

  const rows = mappings.map((m) => ({
    exam_id: examId,
    student_id: m.studentId,
    scan_pdf_url: scanPath,
    start_page: m.startPage,
    end_page: m.endPage,
    status: 'scanned',
    scanned_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('exam_submissions').insert(rows)
  if (error) {
    return { error: 'Kunne ikke opprette innleveringer.' }
  }

  revalidatePath(`/laerer/prover/${examId}/rett`)
  return { success: true }
}
