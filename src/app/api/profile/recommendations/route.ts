import { NextRequest } from 'next/server'

import { getStudyRecommendations } from '@/lib/ai/recommendations'
import { RATE_LIMITS, rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Ikke innlogget' }), { status: 401 })
  }

  const forceRefresh = request.nextUrl.searchParams.get('force') === '1'

  if (forceRefresh) {
    const limitResult = rateLimit(`recommendations:${user.id}`, RATE_LIMITS.recommendations)
    if (!limitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: `Du kan oppdatere anbefalinger én gang per time. Prøv igjen om ${limitResult.retryAfterSeconds} sekunder.`,
        }),
        {
          status: 429,
          headers: { 'Retry-After': String(limitResult.retryAfterSeconds) },
        },
      )
    }
  }

  const result = await getStudyRecommendations({
    studentId: user.id,
    forceRefresh,
  })

  return Response.json({
    recommendations: result.recommendations,
    cached: result.cached,
    generatedAt: new Date().toISOString(),
  })
}
