import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeSubmission, type GradingInput } from '@/lib/ai/exam-grader'
import { z } from 'zod/v4'

const requestSchema = z.object({
  examId: z.uuid(),
})

/**
 * POST /api/exams/grade
 *
 * Triggers AI grading for all 'scanned' submissions of an exam.
 * Processes submissions sequentially (max 10 concurrent in future).
 * Updates exam_answers + exam_submissions via Supabase.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke autentisert.' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 })
  }

  const { examId } = parsed.data

  // Verify teacher owns the exam
  const { data: exam } = await supabase
    .from('exams')
    .select('id, created_by')
    .eq('id', examId)
    .eq('created_by', user.id)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'Fant ikke prøven.' }, { status: 404 })
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('id, part, question_number, content, max_points, solution, grading_criteria')
    .eq('exam_id', examId)
    .order('part')
    .order('question_number')

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Ingen oppgaver funnet for prøven.' }, { status: 400 })
  }

  // Fetch scanned submissions
  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('id, student_id, scan_pdf_url, start_page, end_page, status')
    .eq('exam_id', examId)
    .eq('status', 'scanned')

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ error: 'Ingen innleveringer å rette.' }, { status: 400 })
  }

  // Download the scanned PDF once (all submissions reference the same file)
  const scanPath = submissions[0].scan_pdf_url
  if (!scanPath) {
    return NextResponse.json({ error: 'Mangler skannet PDF.' }, { status: 400 })
  }

  const { data: pdfData, error: downloadError } = await supabase.storage
    .from('user-uploads')
    .download(scanPath)

  if (downloadError || !pdfData) {
    return NextResponse.json({ error: 'Kunne ikke laste ned skannet PDF.' }, { status: 500 })
  }

  const pdfBytes = new Uint8Array(await pdfData.arrayBuffer())

  // Process each submission
  const results: Array<{ submissionId: string; status: 'graded' | 'error'; error?: string }> = []

  for (const submission of submissions) {
    // Mark as grading
    await supabase
      .from('exam_submissions')
      .update({ status: 'grading' })
      .eq('id', submission.id)

    try {
      const input: GradingInput = {
        submissionId: submission.id,
        examId,
        studentId: submission.student_id,
        scanPdfBytes: pdfBytes,
        startPage: submission.start_page,
        endPage: submission.end_page,
        questions,
      }

      const result = await gradeSubmission(input)

      // Insert exam_answers
      const answerRows = result.answers.map((a) => ({
        exam_id: examId,
        submission_id: submission.id,
        question_id: a.questionId,
        student_answer_text: a.studentAnswerText,
        score_percent: a.scorePercent,
        confidence_score: a.confidenceScore,
        error_analysis: a.errorAnalysis,
        llm_feedback: a.llmFeedback,
        teacher_override: false,
      }))

      const { error: insertError } = await supabase
        .from('exam_answers')
        .insert(answerRows)

      if (insertError) {
        throw new Error(`DB-feil ved lagring av svar: ${insertError.message}`)
      }

      // Update submission status + total score
      await supabase
        .from('exam_submissions')
        .update({
          status: 'graded',
          total_score_percent: result.totalScorePercent,
        })
        .eq('id', submission.id)

      results.push({ submissionId: submission.id, status: 'graded' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ukjent feil'
      // Revert to scanned on error
      await supabase
        .from('exam_submissions')
        .update({ status: 'scanned' })
        .eq('id', submission.id)

      results.push({ submissionId: submission.id, status: 'error', error: message })
    }
  }

  const gradedCount = results.filter((r) => r.status === 'graded').length
  const errorCount = results.filter((r) => r.status === 'error').length

  return NextResponse.json({
    message: `Rettet ${gradedCount} av ${submissions.length} innleveringer.${errorCount > 0 ? ` ${errorCount} feilet.` : ''}`,
    results,
  })
}
