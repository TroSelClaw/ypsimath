import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

const bodySchema = z.object({
  total_score_percent: z.number().min(0).max(100),
  answers: z.record(z.string(), z.enum(['fikk_til', 'delvis', 'fikk_ikke_til'])),
})

export async function POST(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke autentisert.' }, { status: 401 })
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Ugyldig payload.' }, { status: 400 })
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('id, created_by')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'Fant ikke øvingsprøven.' }, { status: 404 })
  }

  const { error } = await supabase.from('exam_submissions').insert({
    exam_id: id,
    student_id: user.id,
    status: 'graded',
    total_score_percent: parsedBody.data.total_score_percent,
    scan_pdf_url: `practice:self-report:${Object.keys(parsedBody.data.answers).length}`,
    scanned_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke lagre resultat.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
