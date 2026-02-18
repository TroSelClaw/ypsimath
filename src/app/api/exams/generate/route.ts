import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamInputSchema } from '@/lib/schemas/exams'
import { buildExamPrompt, generatedExamSchema } from '@/lib/ai/exam-generator'
import { hybridSearch } from '@/lib/rag/hybrid-search'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ikke autentisert.' }, { status: 401 })
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Kun lærere kan generere prøver.' }, { status: 403 })
  }

  // Rate limit: 5 exam generations per hour
  const rateLimitResult = rateLimit(`exam-gen:${user.id}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `For mange forespørsler. Prøv igjen om ${rateLimitResult.retryAfterSeconds} sekunder.` },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) } },
    )
  }

  // Parse and validate input
  const body = await request.json().catch(() => null)
  const parsed = createExamInputSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Ugyldig input.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const config = parsed.data

  try {
    // RAG: retrieve relevant exercises and rules for the selected competency goals
    const ragResults = await hybridSearch(
      supabase,
      config.competency_goals.join(' '),
      {
        subjectIds: [config.subject_id],
        contentTypes: ['exercise', 'rule', 'example'],
        limit: 10,
      },
    )

    const ragContext = ragResults.map((r) => r.item.content.slice(0, 500))

    // Build prompt
    const { system, user: userPrompt } = buildExamPrompt(config, ragContext)

    // Call LLM (using fetch to Vercel AI Gateway / OpenAI-compatible endpoint)
    const aiApiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY
    if (!aiApiKey) {
      return NextResponse.json({ error: 'AI-nøkkel ikke konfigurert.' }, { status: 500 })
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 8000,
      }),
      signal: AbortSignal.timeout(55_000),
    })

    if (!aiRes.ok) {
      const errBody = await aiRes.text().catch(() => '')
      console.error('AI API error:', aiRes.status, errBody)
      return NextResponse.json(
        { error: 'Feil ved generering. Prøv igjen.' },
        { status: 502 },
      )
    }

    const aiData = await aiRes.json()
    const rawContent = aiData.choices?.[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json({ error: 'Tomt svar fra AI.' }, { status: 502 })
    }

    // Parse and validate generated exam JSON
    let examJson: unknown
    try {
      examJson = JSON.parse(rawContent)
    } catch {
      console.error('Failed to parse AI JSON:', rawContent.slice(0, 200))
      return NextResponse.json({ error: 'Ugyldig JSON fra AI. Prøv igjen.' }, { status: 502 })
    }

    const examValidation = generatedExamSchema.safeParse(examJson)
    if (!examValidation.success) {
      console.error('Exam validation failed:', examValidation.error.issues)
      return NextResponse.json({ error: 'AI-svar hadde ugyldig format. Prøv igjen.' }, { status: 502 })
    }

    const generatedExam = examValidation.data
    const totalMaxPoints = generatedExam.questions.reduce((s, q) => s + q.max_points, 0)

    // Insert into DB
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        created_by: user.id,
        title: config.title,
        subject_id: config.subject_id,
        total_duration_minutes: config.total_duration_minutes,
        part1_duration_minutes: config.part1_duration_minutes,
        part2_duration_minutes: config.part2_duration_minutes,
        competency_goals: config.competency_goals,
        status: 'draft',
      })
      .select('id')
      .single()

    if (examError || !exam) {
      console.error('DB exam insert error:', examError)
      return NextResponse.json({ error: 'Kunne ikke lagre prøven.' }, { status: 500 })
    }

    // Insert questions
    const questionRows = generatedExam.questions.map((q) => ({
      exam_id: exam.id,
      part: q.part,
      question_number: q.question_number,
      content: q.content,
      max_points: q.max_points,
      solution: q.solution,
      grading_criteria: q.grading_criteria,
    }))

    const { error: questionsError } = await supabase
      .from('exam_questions')
      .insert(questionRows)

    if (questionsError) {
      console.error('DB questions insert error:', questionsError)
      // Clean up the exam row
      await supabase.from('exams').delete().eq('id', exam.id)
      return NextResponse.json({ error: 'Kunne ikke lagre oppgavene.' }, { status: 500 })
    }

    return NextResponse.json({ examId: exam.id, totalMaxPoints, questionCount: generatedExam.questions.length })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tidsavbrudd. Genereringen tok for lang tid. Prøv igjen.' },
        { status: 504 },
      )
    }
    console.error('Exam generation error:', err)
    return NextResponse.json({ error: 'Noe gikk galt. Prøv igjen.' }, { status: 500 })
  }
}
