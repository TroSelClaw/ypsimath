/**
 * Reciprocal Rank Fusion (RRF) — merges two ranked result lists.
 *
 * score(d) = 1/(k + rank_vector) + 1/(k + rank_fts)
 * k = 60 by default (standard from the original paper).
 */

export interface RankedItem {
  id: string
}

export interface RRFResult<T extends RankedItem> {
  item: T
  score: number
}

export function reciprocalRankFusion<T extends RankedItem>(
  vectorResults: T[],
  ftsResults: T[],
  k = 60,
): RRFResult<T>[] {
  const scoreMap = new Map<string, { item: T; score: number }>()

  for (let i = 0; i < vectorResults.length; i++) {
    const item = vectorResults[i]
    const existing = scoreMap.get(item.id)
    const rankScore = 1 / (k + i + 1)
    if (existing) {
      existing.score += rankScore
    } else {
      scoreMap.set(item.id, { item, score: rankScore })
    }
  }

  for (let i = 0; i < ftsResults.length; i++) {
    const item = ftsResults[i]
    const existing = scoreMap.get(item.id)
    const rankScore = 1 / (k + i + 1)
    if (existing) {
      existing.score += rankScore
    } else {
      scoreMap.set(item.id, { item, score: rankScore })
    }
  }

  return Array.from(scoreMap.values()).sort((a, b) => b.score - a.score)
}
