import { describe, it, expect } from 'vitest'
import { reciprocalRankFusion } from './rrf'

describe('reciprocalRankFusion', () => {
  it('merges two disjoint lists', () => {
    const vector = [{ id: 'a' }, { id: 'b' }]
    const fts = [{ id: 'c' }, { id: 'd' }]
    const result = reciprocalRankFusion(vector, fts)
    expect(result).toHaveLength(4)
    // All items should have equal scores since each appears in only one list at same rank
    expect(result[0].score).toBeCloseTo(1 / 61)
    expect(result[1].score).toBeCloseTo(1 / 61)
  })

  it('boosts items appearing in both lists', () => {
    const vector = [{ id: 'a' }, { id: 'b' }]
    const fts = [{ id: 'a' }, { id: 'c' }]
    const result = reciprocalRankFusion(vector, fts)
    // 'a' appears at rank 1 in both → score = 2/(61)
    expect(result[0].item.id).toBe('a')
    expect(result[0].score).toBeCloseTo(2 / 61)
  })

  it('respects rank ordering', () => {
    const vector = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const fts = [{ id: 'c' }, { id: 'b' }, { id: 'a' }]
    const result = reciprocalRankFusion(vector, fts)
    // 'a': 1/61 + 1/63, 'b': 1/62 + 1/62, 'c': 1/63 + 1/61
    // 'b' has highest score (2/62 ≈ 0.03226), 'a' and 'c' are equal
    expect(result[0].score).toBeCloseTo(2 / 62)
    // 'a' and 'c' have equal scores: 1/61 + 1/63
    expect(result[1].score).toBeCloseTo(1 / 61 + 1 / 63)
    expect(result[2].score).toBeCloseTo(1 / 61 + 1 / 63)
  })

  it('handles empty lists', () => {
    expect(reciprocalRankFusion([], [])).toEqual([])
    const result = reciprocalRankFusion([{ id: 'a' }], [])
    expect(result).toHaveLength(1)
  })

  it('accepts custom k parameter', () => {
    const vector = [{ id: 'a' }]
    const fts = [{ id: 'a' }]
    const result = reciprocalRankFusion(vector, fts, 10)
    expect(result[0].score).toBeCloseTo(2 / 11)
  })
})
