import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { hybridSearch } from '@/lib/rag/hybrid-search'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/chat
 * Body: { conversationId?: string, content: string, imageUrl?: string }
 *
 * Streams a tutor response using Gemini Flash + hybrid RAG context.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Ikke innlogget' }), {
      status: 401,
    })
  }

  // Rate limit: 30 messages/hour
  const rateLimitResult = rateLimit(`chat:${user.id}`, { maxRequests: 30, windowMs: 3600_000 })
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: `For mange meldinger. Prøv igjen om ${rateLimitResult.retryAfterSeconds} sekunder.`,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      },
    )
  }

  const body = await request.json()
  const { conversationId, content, imageUrl } = body as {
    conversationId?: string
    content: string
    imageUrl?: string
  }

  if (!content?.trim()) {
    return new Response(JSON.stringify({ error: 'Tom melding' }), {
      status: 400,
    })
  }

  // Load or create conversation
  let convId = conversationId
  if (!convId) {
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        student_id: user.id,
        subject_id: 'r1',
        title: content.slice(0, 100),
      })
      .select('id')
      .single()
    if (convError || !conv) {
      return new Response(
        JSON.stringify({ error: 'Kunne ikke opprette samtale' }),
        { status: 500 },
      )
    }
    convId = conv.id
  }

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'user',
    content,
    image_url: imageUrl ?? null,
  })

  // Load last 10 messages for context
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(10)

  // Load student profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select(
      'mastered_competency_goals, struggling_competency_goals, goals, current_subject',
    )
    .eq('id', user.id)
    .single()

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // RAG search
  const ragResults = await hybridSearch(supabase, content, {
    subjectIds: profile?.current_subject ? [profile.current_subject] : ['r1'],
    limit: 5,
    studentSubjectId: profile?.current_subject ?? 'r1',
  })

  // Build system prompt
  const systemPrompt = buildSystemPrompt(
    profile
      ? {
          displayName: userProfile?.display_name ?? 'Elev',
          currentSubject: profile.current_subject ?? 'R1',
          masteredGoals: profile.mastered_competency_goals ?? [],
          strugglingGoals: profile.struggling_competency_goals ?? [],
          targetGrade: profile.goals?.target_grade,
        }
      : null,
    ragResults,
  )

  // Build messages array
  const messages = (history ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Stream response
  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: systemPrompt,
    messages,
  })

  // Save assistant message after stream completes (fire-and-forget)
  const response = result.toTextStreamResponse()

  // Use a separate promise to save the response
  result.text.then(async (text) => {
    const sources = ragResults.map((r) => ({
      id: r.item.id,
      topic: r.item.topic,
      chapter: r.item.chapter,
      content_type: r.item.content_type,
    }))

    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: text,
      sources,
    })
  })

  return response
}
