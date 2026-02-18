import { reciprocalRankFusion, type RRFResult } from './rrf'
import { embedQuery } from './embedder'
import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUBJECT_BOOST = 1.2

export interface HybridSearchOptions {
  subjectIds?: string[]
  contentTypes?: string[]
  competencyGoals?: string[]
  limit?: number
  /** Boost results matching the student's current subject */
  studentSubjectId?: string
  /** Optional per-subject boost multipliers */
  subjectBoosts?: Record<string, number>
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

export interface CrossSubjectProfile {
  currentSubject?: string | null
  masteredGoals?: string[] | null
  strugglingGoals?: string[] | null
}

export interface CrossSubjectSearchConfig {
  /** Undefined => query all subjects */
  subjectIds?: string[]
  subjectBoosts: Record<string, number>
  studentSubjectId?: string
  mode: 'default' | 'advanced' | 'supportive'
}

/**
 * Builds cross-subject configuration for chat retrieval.
 *
 * - Advanced learners (> 8 mastered goals): include all subjects and boost R2.
 * - Students needing support (> 4 struggling goals): include all subjects and boost 1T/1P.
 * - Otherwise: stay in current subject.
 */
export function buildCrossSubjectSearchConfig(
  profile: CrossSubjectProfile | null,
): CrossSubjectSearchConfig {
  const currentSubject = profile?.currentSubject ?? 'r1'
  const masteredCount = profile?.masteredGoals?.length ?? 0
  const strugglingCount = profile?.strugglingGoals?.length ?? 0

  const subjectBoosts: Record<string, number> = {
    [currentSubject]: DEFAULT_SUBJECT_BOOST,
  }

  if (masteredCount > 8) {
    subjectBoosts.r2 = 1.35
    return {
      subjectIds: undefined,
      subjectBoosts,
      studentSubjectId: currentSubject,
      mode: 'advanced',
    }
  }

  if (strugglingCount > 4) {
    subjectBoosts['1t'] = 1.3
    subjectBoosts['1p'] = 1.25
    return {
      subjectIds: undefined,
      subjectBoosts,
      studentSubjectId: currentSubject,
      mode: 'supportive',
    }
  }

  return {
    subjectIds: [currentSubject],
    subjectBoosts,
    studentSubjectId: currentSubject,
    mode: 'default',
  }
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
  const fetchLimit = Math.min(limit * 3, 50)

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

  let results = reciprocalRankFusion(vectorData, ftsData)

  if (options.studentSubjectId) {
    results = results.map((r) => ({
      ...r,
      score:
        r.item.subject_id === options.studentSubjectId
          ? r.score * DEFAULT_SUBJECT_BOOST
          : r.score,
    }))
  }

  if (options.subjectBoosts) {
    results = results.map((r) => ({
      ...r,
      score: r.score * (options.subjectBoosts?.[r.item.subject_id] ?? 1),
    }))
  }

  results.sort((a, b) => b.score - a.score)

  if (options.competencyGoals?.length) {
    const goalSet = new Set(options.competencyGoals)
    results = results.filter((r) =>
      r.item.competency_goals.some((g) => goalSet.has(g)),
    )
  }

  return results.slice(0, limit)
}
