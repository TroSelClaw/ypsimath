import { reciprocalRankFusion, type RRFResult } from './rrf'
import { embedQuery } from './embedder'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface HybridSearchOptions {
  subjectIds?: string[]
  contentTypes?: string[]
  competencyGoals?: string[]
  limit?: number
  /** Boost results matching the student's current subject */
  studentSubjectId?: string
}

export interface SearchableContent {
  id: string
  subject_id: string
  chapter: string
  topic: string
  content_type: string
  content: string
  competency_goals: string[]
  sort_order: number
}

/**
 * Hybrid search combining vector similarity (HNSW cosine) and
 * full-text search (Norwegian tsvector) via Reciprocal Rank Fusion.
 *
 * Requires two Supabase RPC functions:
 * - vector_search(query_embedding, match_count, filter_subject_ids, filter_content_types)
 * - fts_search(search_query, match_count, filter_subject_ids, filter_content_types)
 */
export async function hybridSearch(
  supabase: SupabaseClient,
  query: string,
  options: HybridSearchOptions = {},
): Promise<RRFResult<SearchableContent>[]> {
  const limit = options.limit ?? 10
  // Fetch more from each source to improve RRF quality
  const fetchLimit = Math.min(limit * 3, 50)

  // Run vector and FTS searches in parallel
  const [embedding, ftsResult] = await Promise.all([
    embedQuery(query),
    supabase.rpc('fts_search', {
      search_query: query,
      match_count: fetchLimit,
      filter_subject_ids: options.subjectIds ?? null,
      filter_content_types: options.contentTypes ?? null,
    }),
  ])

  const vectorResult = await supabase.rpc('vector_search', {
    query_embedding: JSON.stringify(embedding),
    match_count: fetchLimit,
    filter_subject_ids: options.subjectIds ?? null,
    filter_content_types: options.contentTypes ?? null,
  })

  const vectorData: SearchableContent[] = vectorResult.data ?? []
  const ftsData: SearchableContent[] = ftsResult.data ?? []

  // Merge with RRF
  let results = reciprocalRankFusion(vectorData, ftsData)

  // Boost results matching student's subject
  if (options.studentSubjectId) {
    results = results.map((r) => ({
      ...r,
      score:
        r.item.subject_id === options.studentSubjectId
          ? r.score * 1.2
          : r.score,
    }))
    results.sort((a, b) => b.score - a.score)
  }

  // Filter by competency goals if specified
  if (options.competencyGoals?.length) {
    const goalSet = new Set(options.competencyGoals)
    results = results.filter((r) =>
      r.item.competency_goals.some((g) => goalSet.has(g)),
    )
  }

  return results.slice(0, limit)
}
