import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { buildCrossSubjectSearchConfig, hybridSearch } from '@/lib/rag/hybrid-search'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { RATE_LIMITS, rateLimit } from '@/lib/rate-limit'
import { analyzeChatImage } from '@/lib/ai/image-analyzer'

export const runtime = 'nodejs'
export const maxDuration = 60

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function mimeTypeFromPath(path: string) {
  const ext = path.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return null
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

/**
 * POST /api/chat
 * Body: { conversationId?: string, content: string, imageUrl?: string }
 *
 * Streams a tutor response using Gemini Flash + hybrid RAG context.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Ikke innlogget' }), { status: 401 })
  }

  const messageRate = rateLimit(`chat:${user.id}`, RATE_LIMITS.chat)
  if (!messageRate.allowed) {
    return new Response(
      JSON.stringify({
        error: `For mange meldinger. Prøv igjen om ${messageRate.retryAfterSeconds} sekunder.`,
      }),
      {
        status: 429,
        headers: { 'Retry-After': String(messageRate.retryAfterSeconds) },
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
    return new Response(JSON.stringify({ error: 'Tom melding' }), { status: 400 })
  }

  if (imageUrl) {
    const imageRate = rateLimit(`chat-image:${user.id}`, RATE_LIMITS.imageUpload)
    if (!imageRate.allowed) {
      return new Response(
        JSON.stringify({
          error: `For mange bildeopplastinger. Prøv igjen om ${imageRate.retryAfterSeconds} sekunder.`,
        }),
        {
          status: 429,
          headers: { 'Retry-After': String(imageRate.retryAfterSeconds) },
        },
      )
    }
  }

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
      return new Response(JSON.stringify({ error: 'Kunne ikke opprette samtale' }), {
        status: 500,
      })
    }
    convId = conv.id
  }

  let imageContext = ''

  if (imageUrl) {
    const ownedPathPrefix = `${user.id}/chat/`
    if (!imageUrl.startsWith(ownedPathPrefix)) {
      return new Response(JSON.stringify({ error: 'Ugyldig bildebane.' }), { status: 400 })
    }

    const mimeType = mimeTypeFromPath(imageUrl)
    if (!mimeType) {
      return new Response(JSON.stringify({ error: 'Kun JPEG, PNG og WEBP støttes.' }), {
        status: 400,
      })
    }

    const { data: imageData, error: downloadError } = await supabase.storage
      .from('user-uploads')
      .download(imageUrl)

    if (downloadError || !imageData) {
      return new Response(JSON.stringify({ error: 'Kunne ikke hente bildet.' }), { status: 500 })
    }

    const imageBuffer = Buffer.from(await imageData.arrayBuffer())
    const imageBase64 = imageBuffer.toString('base64')
    const analysis = await analyzeChatImage({ imageBase64, mimeType })
    imageContext = analysis.description
  }

  await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'user',
    content,
    image_url: imageUrl ?? null,
  })

  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(10)

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('mastered_competency_goals, struggling_competency_goals, goals, current_subject')
    .eq('id', user.id)
    .single()

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const searchQuery = imageContext ? `${content}\n${imageContext}` : content

  const crossSubjectConfig = buildCrossSubjectSearchConfig(
    profile
      ? {
          currentSubject: profile.current_subject,
          masteredGoals: profile.mastered_competency_goals,
          strugglingGoals: profile.struggling_competency_goals,
        }
      : null,
  )

  const ragResults = await hybridSearch(supabase, searchQuery, {
    subjectIds: crossSubjectConfig.subjectIds,
    limit: 5,
    studentSubjectId: crossSubjectConfig.studentSubjectId,
    subjectBoosts: crossSubjectConfig.subjectBoosts,
  })

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

  const messages = (history ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  if (imageContext) {
    messages[messages.length - 1] = {
      role: 'user',
      content: `${content}\n\n[Bildebeskrivelse]\n${imageContext}`,
    }
  }

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: systemPrompt,
    messages,
  })

  const response = result.toTextStreamResponse()

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
