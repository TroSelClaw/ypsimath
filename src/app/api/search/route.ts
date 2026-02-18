import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/search?q=<query>&limit=<n>
 *
 * Full-text search on published content_elements using Norwegian tsvector.
 * Returns results grouped by content_type.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10),
    50,
  )

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], grouped: {} })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
  }

  // Use plainto_tsquery for safe parsing of user input
  const { data, error } = await supabase.rpc('search_content', {
    search_query: q,
    result_limit: limit,
  })

  if (error) {
    console.error('[search] RPC error:', error.message)
    return NextResponse.json(
      { error: 'Søkefeil. Prøv igjen.' },
      { status: 500 },
    )
  }

  // Group results by content_type
  const grouped: Record<string, typeof data> = {}
  for (const row of data ?? []) {
    const type = row.content_type as string
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(row)
  }

  return NextResponse.json({ results: data ?? [], grouped })
}
