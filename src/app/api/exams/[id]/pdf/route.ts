import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params
  const url = new URL(request.url)
  const type = url.searchParams.get('type') ?? 'exam'

  if (type !== 'exam' && type !== 'solution') {
    return NextResponse.json({ error: 'type må være "exam" eller "solution".' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke autentisert.' }, { status: 401 })
  }

  // Only teachers/admins can export
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Ingen tilgang.' }, { status: 403 })
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'Prøven finnes ikke.' }, { status: 404 })
  }

  const { data: questions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', id)
    .order('part', { ascending: true })
    .order('question_number', { ascending: true })

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Ingen oppgaver funnet.' }, { status: 404 })
  }

  // Build HTML for PDF
  const html = buildExamHTML(exam, questions, type)

  // Try Puppeteer-based PDF generation
  try {
    // @ts-expect-error -- puppeteer optional dependency, installed at deploy time
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20_000 })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    })
    await browser.close()

    // Upload to Supabase Storage
    const storagePath = `exam-pdfs/${id}/${type}.pdf`
    await supabase.storage
      .from('exam-pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    // Update exam record
    const updateField = type === 'exam' ? 'exam_pdf_url' : 'solution_pdf_url'
    await supabase
      .from('exams')
      .update({ [updateField]: storagePath })
      .eq('id', id)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${exam.title} - ${type === 'exam' ? 'oppgaver' : 'losningsforslag'}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation failed:', err)
    // Fallback: return HTML for manual print
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  }
}

function buildExamHTML(
  exam: Record<string, unknown>,
  questions: Array<Record<string, unknown>>,
  type: 'exam' | 'solution',
): string {
  const title = exam.title as string
  const totalDuration = exam.total_duration_minutes as number
  const part1Duration = exam.part1_duration_minutes as number
  const part2Duration = (exam.part2_duration_minutes ?? totalDuration - part1Duration) as number

  const part1Qs = questions.filter((q) => q.part === 1)
  const part2Qs = questions.filter((q) => q.part === 2)
  const totalPoints = questions.reduce((s, q) => s + (q.max_points as number), 0)

  const renderQuestion = (q: Record<string, unknown>, showSolution: boolean) => {
    let html = `
      <div class="question">
        <h3>Oppgave ${q.question_number} <span class="points">(${q.max_points} poeng)</span></h3>
        <div class="content">${q.content}</div>`
    if (showSolution) {
      html += `
        <div class="solution">
          <h4>Løsningsforslag:</h4>
          <div>${q.solution}</div>
        </div>
        <div class="criteria">
          <h4>Vurderingskriterier:</h4>
          <div>${q.grading_criteria}</div>
        </div>`
    }
    html += '</div>'
    return html
  }

  const showSolution = type === 'solution'

  return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <title>${title}${showSolution ? ' — Løsningsforslag' : ''}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 18pt; margin-bottom: 4px; }
    h2 { font-size: 14pt; margin-top: 24px; border-bottom: 1px solid #333; padding-bottom: 4px; }
    h3 { font-size: 12pt; margin-bottom: 4px; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 16px; }
    .points { font-weight: normal; color: #666; }
    .question { margin-bottom: 20px; page-break-inside: avoid; }
    .solution { margin-top: 8px; padding: 8px; background: #f5f5f5; border-left: 3px solid #333; }
    .criteria { margin-top: 8px; padding: 8px; background: #fefce8; border-left: 3px solid #ca8a04; }
    .content { margin-top: 4px; }
    @media print { .solution { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>${title}${showSolution ? ' — Løsningsforslag' : ''}</h1>
  <div class="meta">
    Fag: R1 Matematikk &middot; Varighet: ${totalDuration} min &middot; Totalt ${totalPoints} poeng
  </div>

  <h2>Del 1 — Uten hjelpemidler (${part1Duration} min)</h2>
  ${part1Qs.map((q) => renderQuestion(q, showSolution)).join('\n')}

  <h2>Del 2 — Med hjelpemidler (${part2Duration} min)</h2>
  ${part2Qs.map((q) => renderQuestion(q, showSolution)).join('\n')}
</body>
</html>`
}
